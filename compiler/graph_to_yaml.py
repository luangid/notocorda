#!/usr/bin/env python3
"""Projeção graph.json → graph.yaml — a visão do grafo para agentes de IA.

Contrato: CONTRATO-DE-FORMATOS.md §2.7. O YAML é derivado e somente
leitura; agentes propõem mudanças nos Markdown de autoria, nunca aqui.

Uso: python3 compiler/graph_to_yaml.py <graph.json> [saida.yaml]
"""
import json
import sys
from pathlib import Path

import yaml

FAMILIAS = [
    ("espinha", lambda n: n["type"] == "spine"),
    ("realizacoes", lambda n: n["type"] == "realization"),
    ("sistemas", lambda n: n["type"] == "system"),
    ("dados", lambda n: n["type"] == "data"),
    ("evidencias", lambda n: n["type"] == "evidence"),
    ("problemas", lambda n: n["type"] == "problem"),
]


def frase(rel_type, target, nome):
    return f"{rel_type} → {target} ({nome})" if nome and nome != target else f"{rel_type} → {target}"


def projetar(graph: dict) -> dict:
    nomes = {}
    for n in graph["nodes"]:
        nomes[n["id"]] = n["name"]
    for coll in ("scenarios", "areas", "views"):
        for d in graph.get(coll, []):
            nomes[d["id"]] = d.get("name", d["id"])

    saidas, entradas = {}, {}
    for e in graph["edges"]:
        saidas.setdefault(e["source"], []).append(frase(e["type"], e["target"], nomes.get(e["target"])))
        entradas.setdefault(e["target"], []).append(
            f"{nomes.get(e['source'], e['source'])} ({e['source']}) —{e['type']}→ este")

    def caixa(n):
        d = {"nome": n["name"]}
        if n.get("spine_kind"):
            d["tipo"] = n["spine_kind"]
        d["status"] = n["status"]
        if n.get("confidence"):
            d["confianca"] = n["confidence"]
        if n.get("definition"):
            d["definicao"] = n["definition"]
        if n.get("scenarios"):
            d["cenarios"] = [f"{s} ({nomes.get(s, s)})" for s in n["scenarios"]]
        else:
            d["cenarios"] = "todos"
        if n.get("areas"):
            d["areas"] = [f"{a} ({nomes.get(a, a)})" for a in n["areas"]]
        if saidas.get(n["id"]):
            d["relacoes"] = saidas[n["id"]]
        if entradas.get(n["id"]):
            d["recebe"] = entradas[n["id"]]
        # tags e aliases ainda não aparecem nos grafos de hoje, mas o adaptador
        # do viewer os lê — projetar agora evita que sumam em silêncio depois
        if n.get("tags"):
            d["tags"] = n["tags"]
        if n.get("aliases"):
            d["tambem_chamado_de"] = n["aliases"]
        if n.get("source", {}).get("path"):
            d["arquivo"] = n["source"]["path"]
        return d

    out = {
        "atlas": {
            "aviso": "Projeção derivada para leitura por IA — nunca editar; propor mudanças nos Markdown de autoria.",
            "schema_version": graph["schema_version"],
            "gerado_em": graph["generated_at"],
            "commit": (graph.get("source") or {}).get("commit"),
        },
        "cenarios": [
            {"id": s["id"], "nome": s["name"], "status": s["status"], "baseline": s.get("baseline")}
            for s in graph.get("scenarios", [])
        ],
        "areas": [{"id": a["id"], "nome": a["name"]} for a in graph.get("areas", [])],
        "views": [
            {"id": v["id"], "nome": v["name"],
             "niveis": [{"nivel": sl["level"],
                         "cenario": sl["scenario"] or "espinha-dorsal (nivel 0)"}
                        for sl in v.get("scenario_levels", [])]}
            for v in graph.get("views", [])
        ],
    }
    for chave, pred in FAMILIAS:
        grupo = {n["id"]: caixa(n) for n in graph["nodes"] if pred(n)}
        if grupo:
            out[chave] = grupo

    diags = graph.get("diagnostics", {})
    # Erros vêm PRIMEIRO e sempre: sem eles o agente lê um mapa que se diz
    # íntegro sem ser. Lacunas e avisos são leitura de trabalho.
    erros = [e["message"] for e in diags.get("errors", [])]
    lacunas = [g["message"] for g in diags.get("gaps", [])]
    avisos = [w["message"] for w in diags.get("warnings", [])]
    if erros:
        out["erros"] = erros
        out["atlas"]["integridade"] = f"{len(erros)} erro(s) de validação — este grafo NÃO está íntegro"
    if lacunas:
        out["lacunas"] = lacunas
    if avisos:
        out["avisos"] = avisos
    return out


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else src.with_suffix(".yaml")
    graph = json.loads(src.read_text(encoding="utf-8"))
    texto = yaml.dump(projetar(graph), allow_unicode=True, sort_keys=False,
                      default_flow_style=False, width=100)
    dst.write_text("# Gerado por compiler/graph_to_yaml.py — NÃO EDITAR.\n" + texto, encoding="utf-8")
    print(f"{dst} escrito ({len(texto.splitlines())} linhas)")


if __name__ == "__main__":
    main()
