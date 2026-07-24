#!/usr/bin/env python3
"""Audita a projeção graph.json → graph.yaml (CONTRATO §2.7).

A pergunta que este script responde: *o agente que lê o YAML enxerga o mesmo
que a pessoa que olha o Mapa Vivo?* Ele verifica CONSERVAÇÃO nos dois
sentidos — nada do grafo se perde na projeção, e nada aparece no YAML que
não exista no grafo.

Uso:
    python3 compiler/auditar_yaml.py generated/graph.json [outro.json ...]
    python3 compiler/auditar_yaml.py --todos      # todo graph.json da raiz
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from graph_to_yaml import FAMILIAS, projetar  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent


def auditar(caminho: Path) -> list[str]:
    grafo = json.loads(caminho.read_text(encoding="utf-8"))
    proj = projetar(grafo)
    falhas: list[str] = []

    def erro(msg: str):
        falhas.append(msg)

    # ---- 1. caixas: toda caixa do grafo está no YAML, na família certa -----
    grupos = {chave: proj.get(chave, {}) for chave, _ in FAMILIAS}
    no_yaml = {}
    for chave, grupo in grupos.items():
        for nid in grupo:
            if nid in no_yaml:
                erro(f"caixa duplicada no YAML: {nid} (em {no_yaml[nid]} e {chave})")
            no_yaml[nid] = chave

    familia_de = {}
    for chave, pred in FAMILIAS:
        for n in grafo["nodes"]:
            if pred(n):
                familia_de[n["id"]] = chave

    for n in grafo["nodes"]:
        nid = n["id"]
        if nid not in familia_de:
            erro(f"caixa de tipo não projetado (some do YAML): {nid} type={n.get('type')!r}")
            continue
        if nid not in no_yaml:
            erro(f"caixa ausente no YAML: {nid}")
        elif no_yaml[nid] != familia_de[nid]:
            erro(f"caixa na família errada: {nid} → {no_yaml[nid]} (esperado {familia_de[nid]})")

    ids_grafo = {n["id"] for n in grafo["nodes"]}
    for nid in no_yaml:
        if nid not in ids_grafo:
            erro(f"caixa inventada no YAML (não existe no grafo): {nid}")

    # ---- 2. campos de cada caixa ------------------------------------------
    por_id = {n["id"]: n for n in grafo["nodes"]}
    for nid, chave in no_yaml.items():
        d, n = grupos[chave][nid], por_id.get(nid)
        if not n:
            continue
        if d.get("nome") != n["name"]:
            erro(f"{nid}: nome divergente ({d.get('nome')!r} ≠ {n['name']!r})")
        if d.get("status") != n.get("status"):
            erro(f"{nid}: status divergente ({d.get('status')!r} ≠ {n.get('status')!r})")
        if n.get("confidence") and d.get("confianca") != n["confidence"]:
            erro(f"{nid}: confiança divergente")
        if n.get("definition") and not d.get("definicao"):
            erro(f"{nid}: definição existe no grafo e sumiu no YAML")
        if n.get("spine_kind") and d.get("tipo") != n["spine_kind"]:
            erro(f"{nid}: spine_kind divergente ({d.get('tipo')!r} ≠ {n['spine_kind']!r})")
        if n.get("source", {}).get("path") and not d.get("arquivo"):
            erro(f"{nid}: arquivo-fonte sumiu no YAML")
        if n.get("tags") and sorted(d.get("tags") or []) != sorted(n["tags"]):
            erro(f"{nid}: tags divergentes")
        if n.get("aliases") and sorted(d.get("tambem_chamado_de") or []) != sorted(n["aliases"]):
            erro(f"{nid}: aliases divergentes (busca do viewer os usa)")
        # cenários e áreas — o que decide visibilidade e nuvem no viewer
        cen_json = n.get("scenarios") or []
        cen_yaml = d.get("cenarios")
        if cen_json:
            ids_yaml = [c.split(" (")[0] for c in (cen_yaml or [])]
            if sorted(ids_yaml) != sorted(cen_json):
                erro(f"{nid}: cenários divergentes ({ids_yaml} ≠ {cen_json})")
        elif cen_yaml != "todos":
            erro(f"{nid}: sem cenários no grafo, mas YAML diz {cen_yaml!r}")
        ar_json = n.get("areas") or []
        ids_ar = [a.split(" (")[0] for a in (d.get("areas") or [])]
        if sorted(ids_ar) != sorted(ar_json):
            erro(f"{nid}: áreas divergentes ({ids_ar} ≠ {ar_json})")

    # ---- 3. arestas: cada uma aparece na saída da origem E na entrada ------
    saidas_yaml, entradas_yaml = set(), set()
    for chave, grupo in grupos.items():
        for nid, d in grupo.items():
            for frase in d.get("relacoes", []) or []:
                tipo, resto = frase.split(" → ", 1)
                saidas_yaml.add((nid, tipo, resto.split(" (")[0]))
            for frase in d.get("recebe", []) or []:
                # "Nome com (parênteses) (id.do.no) —tipo→ este": o id é sempre
                # o ÚLTIMO parêntese antes do travessão
                cabeca, cauda = frase.rsplit(" —", 1)
                origem = cabeca.rsplit("(", 1)[1].rstrip(")")
                tipo = cauda.split("→")[0]
                entradas_yaml.add((origem, tipo, nid))

    arestas = {(e["source"], e["type"], e["target"]) for e in grafo["edges"]}
    caixas = ids_grafo
    for a in sorted(arestas):
        if a[0] not in caixas:
            continue  # origem que não é caixa não tem onde ser projetada
        if a not in saidas_yaml:
            erro(f"relação ausente no YAML (saída): {a[0]} —{a[1]}→ {a[2]}")
        if a[2] in caixas and a not in entradas_yaml:
            erro(f"relação ausente no YAML (entrada): {a[0]} —{a[1]}→ {a[2]}")
    for a in sorted(saidas_yaml - arestas):
        erro(f"relação inventada no YAML: {a[0]} —{a[1]}→ {a[2]}")

    # ---- 4. cenários, áreas, níveis --------------------------------------
    cen_j = {s["id"]: s for s in grafo.get("scenarios", [])}
    cen_y = {c["id"]: c for c in proj.get("cenarios", [])}
    for sid, s in cen_j.items():
        if sid not in cen_y:
            erro(f"cenário ausente no YAML: {sid}")
            continue
        if cen_y[sid].get("baseline") != s.get("baseline"):
            erro(f"cenário {sid}: baseline divergente (comparação To-Be depende disso)")
        if cen_y[sid].get("status") != s.get("status"):
            erro(f"cenário {sid}: status divergente (decide As-Is × To-Be)")
    ar_j = {a["id"] for a in grafo.get("areas", [])}
    ar_y = {a["id"] for a in proj.get("areas", [])}
    for aid in ar_j - ar_y:
        erro(f"área ausente no YAML: {aid}")

    for v in grafo.get("views", []):
        vy = next((x for x in proj.get("views", []) if x["id"] == v["id"]), None)
        if not vy:
            erro(f"view ausente no YAML: {v['id']}")
            continue
        niveis_j = [(sl["level"], sl.get("scenario")) for sl in v.get("scenario_levels", [])]
        niveis_y = [(x["nivel"], None if str(x["cenario"]).startswith("espinha-dorsal (") else x["cenario"])
                    for x in vy.get("niveis", [])]
        if sorted(niveis_j) != sorted(niveis_y, key=lambda t: (t[0], str(t[1]))):
            erro(f"view {v['id']}: níveis divergentes ({niveis_y} ≠ {niveis_j})")

    # ---- 5. diagnósticos --------------------------------------------------
    diags = grafo.get("diagnostics", {})
    if diags.get("errors") and "erros" not in proj:
        erro(f"{len(diags['errors'])} erro(s) de validação existem no grafo e NÃO são projetados "
             "— o agente lê um mapa que se diz íntegro")
    if len(diags.get("gaps", [])) != len(proj.get("lacunas", [])):
        erro("número de lacunas divergente entre grafo e YAML")

    # ---- 6. o arquivo em disco está atualizado? ---------------------------
    em_disco = caminho.with_suffix(".yaml")
    if em_disco.exists():
        atual = yaml.safe_load(em_disco.read_text(encoding="utf-8"))
        if atual != proj:
            erro(f"{em_disco.name} em disco está DESATUALIZADO em relação ao {caminho.name} "
                 "(rode graph_to_yaml.py)")
    else:
        erro(f"{em_disco.name} não existe — o agente não tem o que ler")

    return falhas


def main() -> int:
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    alvos = (sorted(p for p in RAIZ.glob("**/graph.json")
                    if not any(x in (".venv", ".obsidian", ".git") for x in p.parts))
             if args[0] == "--todos" else [Path(a) for a in args])

    total = 0
    for alvo in alvos:
        falhas = auditar(alvo if alvo.is_absolute() else RAIZ / alvo)
        rel = alvo.relative_to(RAIZ) if alvo.is_absolute() and alvo.is_relative_to(RAIZ) else alvo
        if falhas:
            print(f"✗ {rel} — {len(falhas)} problema(s)")
            for f in falhas:
                print(f"    · {f}")
        else:
            print(f"✓ {rel} — projeção fiel")
        total += len(falhas)
    print(f"\n{total} problema(s) no total")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
