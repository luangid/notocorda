#!/usr/bin/env python3
"""Valida um graph.json contra o contrato de formatos.

Duas camadas, como o CONTRATO §1 pede:
  1. schema  — schemas/graph.schema.json (forma do artefato);
  2. regras  — o que o schema não captura (Guia §14): ids únicos, arestas
     resolvidas, spine com spine_kind, combinações origem→relação→destino
     do registries.yaml, `related-to` sempre aviso.

Uso:
    python3 compiler/validate.py examples/cafeteria/graph.json
    python3 compiler/validate.py examples/*/graph.json

Saída: relatório legível. Código de saída 1 se houver erro (aviso não falha).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SCHEMA = RAIZ / "schemas" / "graph.schema.json"
REGISTRIES = RAIZ / "schemas" / "registries.yaml"


def carregar_registries() -> dict:
    import yaml

    with REGISTRIES.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def tipo_de(no: dict) -> str:
    """Tipo para efeito de combinação: spine vira o spine_kind."""
    return no["spine_kind"] if no["type"] == "spine" and no.get("spine_kind") else no["type"]


def validar_schema(grafo: dict) -> list[str]:
    import jsonschema

    with SCHEMA.open(encoding="utf-8") as f:
        schema = json.load(f)
    validador = jsonschema.Draft202012Validator(schema)
    erros = []
    for e in sorted(validador.iter_errors(grafo), key=lambda e: list(e.path)):
        caminho = "/".join(str(p) for p in e.path) or "(raiz)"
        erros.append(f"{caminho}: {e.message}")
    return erros


def validar_regras(grafo: dict, reg: dict) -> tuple[list[str], list[str]]:
    erros: list[str] = []
    avisos: list[str] = []

    nos = grafo.get("nodes", [])
    por_id: dict[str, dict] = {}
    for n in nos:
        if n["id"] in por_id:
            erros.append(f"id duplicado: {n['id']}")
        por_id[n["id"]] = n
        if n["type"] == "spine" and not n.get("spine_kind"):
            erros.append(f"{n['id']}: type spine exige spine_kind (Guia §4.2)")
        if n["type"] != "spine" and n.get("spine_kind"):
            erros.append(f"{n['id']}: spine_kind só vale para type spine")

    # documentos contextuais são alvo legítimo de aresta, mas não são caixa
    contextuais = {c["id"] for c in grafo.get("areas", [])}
    contextuais |= {c["id"] for c in grafo.get("scenarios", [])}
    contextuais |= {v["id"] for v in grafo.get("views", [])}

    relacoes = reg["relation_types"]
    for e in grafo.get("edges", []):
        origem, destino, tipo = e["source"], e["target"], e["type"]
        if origem not in por_id:
            erros.append(f"aresta com origem inexistente: {origem} -{tipo}-> {destino}")
            continue
        if destino not in por_id and destino not in contextuais:
            erros.append(f"aresta com destino não resolvido: {origem} -{tipo}-> {destino}")
            continue
        if tipo not in relacoes:
            erros.append(f"relação fora do vocabulário: {tipo} ({origem} → {destino})")
            continue
        if tipo == "related-to":
            avisos.append(f"`related-to` é provisória (Guia §6.4): {origem} → {destino}")
            continue

        regra = relacoes[tipo]
        t_origem = tipo_de(por_id[origem])
        permitidas_origem = regra.get("from") or []
        if permitidas_origem and t_origem not in permitidas_origem:
            avisos.append(
                f"combinação atípica: `{tipo}` sai de {t_origem} ({origem}); "
                f"típico seria {', '.join(permitidas_origem)}"
            )
        if destino in por_id:
            t_destino = tipo_de(por_id[destino])
            permitidas_destino = regra.get("to") or []
            # `to: [spine]` aceita qualquer spine_kind
            if permitidas_destino and t_destino not in permitidas_destino:
                alvo_e_spine = por_id[destino]["type"] == "spine" and "spine" in permitidas_destino
                if not alvo_e_spine:
                    avisos.append(
                        f"combinação atípica: `{tipo}` chega em {t_destino} ({destino}); "
                        f"típico seria {', '.join(permitidas_destino)}"
                    )

    return erros, avisos


def descrever_eixo(grafo: dict) -> list[str]:
    """Descreve a cadeia de `advances` — incluindo ciclos, que são legítimos."""
    por_id = {n["id"]: n for n in grafo.get("nodes", [])}

    def eh_etapa(i: str) -> bool:
        n = por_id.get(i)
        return bool(n and n.get("spine_kind") == "value-stage")

    sucessores: dict[str, list[str]] = {}
    tem_antecessor: set[str] = set()
    for e in grafo.get("edges", []):
        if e["type"] == "advances" and eh_etapa(e["source"]) and eh_etapa(e["target"]):
            sucessores.setdefault(e["source"], []).append(e["target"])
            tem_antecessor.add(e["target"])

    etapas = [n["id"] for n in grafo.get("nodes", []) if n.get("spine_kind") == "value-stage"]
    if not etapas:
        return []

    inicios = [i for i in etapas if i not in tem_antecessor]
    linhas = [f"{len(etapas)} etapas de valor; início: " + (", ".join(inicios) if inicios else "(nenhuma sem antecessor — ciclo puro)")]

    retornos = []
    ordem: list[str] = []
    visitados: set[str] = set()
    fila = list(inicios) or [etapas[0]]
    while fila:
        atual = fila.pop(0)
        if atual in visitados:
            continue
        visitados.add(atual)
        ordem.append(atual)
        for prox in sucessores.get(atual, []):
            if prox in visitados:
                retornos.append((atual, prox))
            else:
                fila.append(prox)
    for atual in ordem:
        for prox in sucessores.get(atual, []):
            if ordem.index(prox) <= ordem.index(atual) and (atual, prox) not in retornos:
                retornos.append((atual, prox))

    orfas = [i for i in etapas if i not in visitados]
    if orfas:
        linhas.append("etapas fora da cadeia: " + ", ".join(orfas))
    for origem, destino in retornos:
        linhas.append(f"retorno de ciclo: {por_id[origem]['name']} → {por_id[destino]['name']}")
    return linhas


def validar_arquivo(caminho: Path, reg: dict) -> bool:
    print(f"\n── {caminho.relative_to(RAIZ) if caminho.is_relative_to(RAIZ) else caminho}")
    try:
        with caminho.open(encoding="utf-8") as f:
            grafo = json.load(f)
    except (OSError, json.JSONDecodeError) as exc:
        print(f"   ERRO: não consegui ler o arquivo — {exc}")
        return False

    erros = validar_schema(grafo)
    if erros:
        print(f"   schema: {len(erros)} erro(s)")
        for e in erros:
            print(f"     ✗ {e}")
    else:
        print("   schema: ok")

    erros_regra, avisos = validar_regras(grafo, reg)
    erros += erros_regra
    if erros_regra:
        print(f"   regras: {len(erros_regra)} erro(s)")
        for e in erros_regra:
            print(f"     ✗ {e}")
    else:
        print("   regras: ok")

    for a in avisos:
        print(f"     ⚠ {a}")

    for linha in descrever_eixo(grafo):
        print(f"     · {linha}")

    diag = grafo.get("diagnostics", {})
    contagem = {k: len(diag.get(k, [])) for k in ("errors", "warnings", "gaps")}
    print(
        f"   {len(grafo.get('nodes', []))} nós · {len(grafo.get('edges', []))} relações · "
        f"diagnostics: {contagem['errors']} erros, {contagem['warnings']} avisos, {contagem['gaps']} lacunas"
    )
    return not erros


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    reg = carregar_registries()
    ok = True
    for arg in argv[1:]:
        ok = validar_arquivo(Path(arg).resolve(), reg) and ok
    print("\n" + ("tudo válido." if ok else "há erros a corrigir."))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
