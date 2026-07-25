#!/usr/bin/env python3
"""Consulta: a interface de terminal do mapa — as lentes da IA.

O humano tem o Mapa Vivo; um agente tem estes subcomandos. Cada lente devolve
um RECORTE do grafo em YAML, no mesmo vocabulário do graph.yaml (frases
legíveis, famílias, `recebe:`), nunca um desenho. Consome somente o plano
derivado (graph.json) — jamais os Markdown de autoria — e não escreve nada
além do próprio graph.json recompilado quando o vault está velho.

Uso: notocorda <lente> <vault-ou-graph.json> [opções]

    check    saúde do vault: erros, avisos e lacunas; exit code 1 se houver erro
    view     recorte por nível/cenário/tipo/área/status (o seletor da prancha)
    focus    uma caixa e sua vizinhança até N saltos (o clique na caixa)
    impacto  análise de impacto: quem para se a caixa parar (ou --reverso)
    resumo   briefing executivo: totais, espinha, cenários, áreas, diagnósticos

Apontar para a PASTA recompila se algum Markdown estiver mais novo; apontar
para um graph.json usa o arquivo como está (bom para fixtures).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import yaml

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "desktop"))
sys.path.insert(0, str(RAIZ / "compiler"))

from graph_to_yaml import projetar  # noqa: E402

FAMILIAS = ["spine", "realization", "system", "data", "evidence", "problem"]

# Semântica de dependência para a lente `impacto`: dep(A → B) = "A depende
# de B". Cada relação do contrato ou segue a seta (True) ou a inverte (False).
DEPENDENCIA = {
    "requires": True,    # A requires B     → A depende de B
    "uses": True,        # A uses B         → A depende de B
    "enables": False,    # A enables B      → B depende de A
    "supports": False,   # A supports B     → B depende de A
    "realizes": False,   # A realizes B     → B (espinha) depende da realização
    "advances": False,   # A advances B     → o jusante depende do montante
}


def carregar(alvo: str) -> tuple[dict, Path]:
    from notocorda_desktop import resolver_mapa
    caminho = resolver_mapa(Path(alvo).expanduser().resolve())
    return json.loads(caminho.read_text(encoding="utf-8")), caminho


def emitir(dados: dict) -> None:
    print(yaml.dump(dados, allow_unicode=True, sort_keys=False,
                    default_flow_style=False, width=100), end="")


def nomes_de(graph: dict) -> dict:
    nomes = {n["id"]: n["name"] for n in graph["nodes"]}
    for coll in ("areas", "scenarios", "views"):
        for d in graph.get(coll, []):
            nomes[d["id"]] = d.get("name", d["id"])
    return nomes


def recortar(graph: dict, ids: set) -> dict:
    """Cópia do grafo só com as caixas pedidas (e as arestas entre elas)."""
    diags = graph.get("diagnostics", {})
    return {**graph,
            "nodes": [n for n in graph["nodes"] if n["id"] in ids],
            "edges": [e for e in graph["edges"]
                      if e["source"] in ids and e["target"] in ids],
            "diagnostics": {"errors": [],
                            "warnings": [],
                            "gaps": [g for g in diags.get("gaps", [])
                                     if g.get("node") in ids]}}


# ---------------------------------------------------------------- lentes ---

def lente_check(args) -> int:
    """Sempre recompila (quando é pasta): o objetivo É o diagnóstico fresco."""
    alvo = Path(args.alvo).expanduser().resolve()
    if alvo.is_file():
        graph = json.loads(alvo.read_text(encoding="utf-8"))
    else:
        import build_graph
        schemas = alvo / "schemas"
        if not (schemas / "registries.yaml").exists():
            schemas = RAIZ / "schemas"
        graph = build_graph.construir(alvo, schemas)
    d = graph.get("diagnostics", {})
    erros, avisos, lacunas = d.get("errors", []), d.get("warnings", []), d.get("gaps", [])
    emitir({"vault": str(alvo),
            "caixas": len(graph["nodes"]), "arestas": len(graph["edges"]),
            "erros": [e["message"] for e in erros] or 0,
            "avisos": [w["message"] for w in avisos] or 0,
            "lacunas": [g["message"] for g in lacunas] or 0,
            "veredito": "REPROVADO" if erros else "aprovado"})
    return 1 if erros else 0


def lente_view(args) -> int:
    graph, _ = carregar(args.alvo)
    cenario = args.cenario
    if args.nivel is not None:
        views = graph.get("views", [])
        if not views:
            sys.exit("erro: o grafo não tem views — use --cenario")
        niveis = {sl["level"]: sl["scenario"] for sl in views[0].get("scenario_levels", [])}
        if args.nivel not in niveis:
            sys.exit(f"erro: nível {args.nivel} não existe na view "
                     f"(níveis: {sorted(niveis)})")
        cenario = niveis[args.nivel]          # None = espinha dorsal

    def entra(n) -> bool:
        if args.tipo and n["type"] not in args.tipo:
            return False
        if args.sem_tipo and n["type"] in args.sem_tipo:
            return False
        if args.area and not set(args.area) & set(n.get("areas", [])):
            return False
        if args.sem_area and set(args.sem_area) & set(n.get("areas", [])):
            return False
        if args.status and n["status"] not in args.status:
            return False
        if args.nivel is not None and cenario is None:
            return n["type"] == "spine"       # nível 0: só a espinha
        if cenario:
            return n["type"] == "spine" or not n.get("scenarios") \
                or cenario in n["scenarios"]
        return True

    ids = {n["id"] for n in graph["nodes"] if entra(n)}
    recorte = projetar(recortar(graph, ids))
    recorte["atlas"]["recorte"] = {
        "de": len(graph["nodes"]), "mantidas": len(ids),
        "filtros": {k: v for k, v in (("nivel", args.nivel), ("cenario", cenario),
                                      ("tipo", args.tipo), ("sem_tipo", args.sem_tipo),
                                      ("area", args.area), ("sem_area", args.sem_area),
                                      ("status", args.status)) if v not in (None, [])}}
    emitir(recorte)
    return 0


def lente_focus(args) -> int:
    graph, _ = carregar(args.alvo)
    ids_validos = {n["id"] for n in graph["nodes"]}
    if args.id not in ids_validos:
        sys.exit(f"erro: caixa {args.id} não existe no grafo")
    viz = {}
    for e in graph["edges"]:
        viz.setdefault(e["source"], set()).add(e["target"])
        viz.setdefault(e["target"], set()).add(e["source"])
    atual, todos = {args.id}, {args.id}
    for _ in range(args.raio):
        atual = {v for n in atual for v in viz.get(n, ())} - todos
        todos |= atual
    recorte = projetar(recortar(graph, todos & ids_validos))
    recorte["atlas"]["foco"] = {"caixa": args.id, "raio": args.raio,
                                "vizinhas": len(todos & ids_validos) - 1}
    emitir(recorte)
    return 0


def lente_impacto(args) -> int:
    graph, _ = carregar(args.alvo)
    nomes = nomes_de(graph)
    if args.id not in nomes:
        sys.exit(f"erro: caixa {args.id} não existe no grafo")

    # dep[b] = lista de (a, frase) tal que a depende de b (e vice-versa em rev)
    dep_de, dep_para = {}, {}
    for e in graph["edges"]:
        if e["type"] not in DEPENDENCIA:
            continue
        a, b = ((e["source"], e["target"]) if DEPENDENCIA[e["type"]]
                else (e["target"], e["source"]))
        frase = f'{e["source"]} —{e["type"]}→ {e["target"]}'
        dep_de.setdefault(b, []).append((a, frase))    # quem depende de b
        dep_para.setdefault(a, []).append((b, frase))  # de quem a depende

    grafo_busca = dep_para if args.reverso else dep_de
    ondas, alcancados, frente = [], {args.id}, {args.id}
    while frente:
        proxima = {}
        for n in frente:
            for outro, frase in grafo_busca.get(n, ()):
                if outro not in alcancados:
                    proxima.setdefault(outro, frase)
        if not proxima:
            break
        alcancados |= set(proxima)
        frente = set(proxima)
        ondas.append({"distancia": len(ondas) + 1,
                      "caixas": [f"{o} ({nomes.get(o, '?')}) · via {fr}"
                                 for o, fr in sorted(proxima.items())]})
    emitir({"alvo": f"{args.id} ({nomes[args.id]})",
            "pergunta": ("de que esta caixa depende para funcionar?" if args.reverso
                         else "se esta caixa parar, o que para junto?"),
            "relacoes_consideradas": sorted(DEPENDENCIA),
            "alcance_total": len(alcancados) - 1,
            "ondas": ondas or "nada — caixa sem dependências nesse sentido"})
    return 0


def lente_resumo(args) -> int:
    graph, origem = carregar(args.alvo)
    nomes = nomes_de(graph)
    nos, arestas = graph["nodes"], graph["edges"]
    por_familia = {f: [n for n in nos if n["type"] == f] for f in FAMILIAS}

    realizadas = {e["target"] for e in arestas if e["type"] == "realizes"}
    cobertas = set(realizadas)
    for e in arestas:
        if e["type"] == "enables" and e["source"] in realizadas:
            cobertas.add(e["target"])
    caps = [n for n in por_familia["spine"] if n.get("spine_kind") == "capability"]
    etapas = [n for n in por_familia["spine"] if n.get("spine_kind") == "value-stage"]

    def mix_confianca(grupo):
        m = {}
        for n in grupo:
            m[n.get("confidence", "sem-confianca")] = m.get(n.get("confidence", "sem-confianca"), 0) + 1
        return m

    resumo_areas = {}
    for a in graph.get("areas", []):
        membros = [n for n in nos if a["id"] in n.get("areas", [])]
        if not membros and not args.todas_areas:
            continue
        resumo_areas[a["id"]] = {
            "nome": a["name"], "caixas": len(membros),
            "por_familia": {f: sum(1 for n in membros if n["type"] == f)
                            for f in FAMILIAS if any(n["type"] == f for n in membros)},
            "problemas": [f'{n["id"]} ({n["name"]})' for n in membros
                          if n["type"] == "problem"] or "nenhum mapeado",
            "confianca": mix_confianca(membros)}

    d = graph.get("diagnostics", {})
    emitir({
        "mapa": {"origem": str(origem), "caixas": len(nos), "arestas": len(arestas),
                 "por_familia": {f: len(v) for f, v in por_familia.items() if v}},
        "espinha": {
            "elementos": len(por_familia["spine"]),
            "por_tipo": {k: sum(1 for n in por_familia["spine"] if n.get("spine_kind") == k)
                         for k in ("objective", "value-stage", "capability",
                                   "invariant", "event", "obligation")},
            "capacidades_realizadas": f"{sum(1 for c in caps if c['id'] in realizadas)}"
                                      f" de {len(caps)}",
            "etapas_cobertas": f"{sum(1 for v in etapas if v['id'] in cobertas)}"
                               f" de {len(etapas)}",
            "confianca": mix_confianca(por_familia["spine"])},
        "cenarios": [{"id": s["id"], "nome": s["name"], "status": s["status"],
                      "baseline": s.get("baseline")}
                     for s in graph.get("scenarios", [])] or
                    "nenhum — só a espinha (As-Is ainda não mapeado)",
        "areas": resumo_areas or
                 "nenhuma com membros declarados (espinha não declara área — "
                 "pertencimento derivado é backlog do Marco 1)",
        "problemas_abertos": [f'{n["id"]} ({n["name"]})'
                              for n in por_familia["problem"]
                              if n["status"] in ("active", "draft")] or "nenhum mapeado",
        "diagnosticos": {"erros": len(d.get("errors", [])),
                         "avisos": len(d.get("warnings", [])),
                         "lacunas": len(d.get("gaps", []))},
    })
    return 0


# ------------------------------------------------------------------ main ---

def main() -> int:
    p = argparse.ArgumentParser(prog="notocorda", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="lente", required=True)

    def com_alvo(nome, ajuda):
        s = sub.add_parser(nome, help=ajuda)
        s.add_argument("alvo", help="pasta do vault ou graph.json")
        return s

    com_alvo("check", "saúde do vault (exit 1 se houver erro)")

    v = com_alvo("view", "recorte por nível/cenário/tipo/área/status")
    v.add_argument("--nivel", type=int, help="nível da view (0 = espinha)")
    v.add_argument("--cenario", help="id do cenário (alternativa a --nivel)")
    v.add_argument("--tipo", action="append", choices=FAMILIAS, help="só estas famílias")
    v.add_argument("--sem-tipo", action="append", choices=FAMILIAS, dest="sem_tipo",
                   help="esconder estas famílias")
    v.add_argument("--area", action="append", help="só caixas desta área (id)")
    v.add_argument("--sem-area", action="append", dest="sem_area",
                   help="esconder caixas desta área (id)")
    v.add_argument("--status", action="append", help="só estes status")

    f = com_alvo("focus", "uma caixa e sua vizinhança")
    f.add_argument("id", help="id da caixa")
    f.add_argument("--raio", type=int, default=1, help="saltos de vizinhança (padrão 1)")

    i = com_alvo("impacto", "quem para se a caixa parar")
    i.add_argument("id", help="id da caixa")
    i.add_argument("--reverso", action="store_true",
                   help="inverte: de que a caixa depende")

    r = com_alvo("resumo", "briefing executivo do mapa")
    r.add_argument("--todas-areas", action="store_true", dest="todas_areas",
                   help="inclui áreas sem nenhum membro")

    args = p.parse_args()
    return {"check": lente_check, "view": lente_view, "focus": lente_focus,
            "impacto": lente_impacto, "resumo": lente_resumo}[args.lente](args)


if __name__ == "__main__":
    sys.exit(main())
