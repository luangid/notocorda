#!/usr/bin/env python3
"""Compilador: Markdown de autoria → generated/graph.json.

Cobre o suficiente para a espinha v1 (Guia §13, subconjunto): frontmatter,
H1, seção Definição, relações tipadas do corpo, validação de IDs/alvos/
tipos de relação contra schemas/registries.yaml, avisos e lacunas básicas.
NÃO é o compilador do Marco 1 completo (sem backlinks.json, diff, índices).

Uso: python3 compiler/build_graph.py [raiz-do-vault] [saida] [pasta-schemas]
     (padrões: pasta pai deste script; generated/graph.json; raiz/schemas)
     pasta-schemas existe para compilar vaults como examples/cafeteria/,
     que não têm schemas/ própria e reaproveitam a schemas/ do repositório.

     --yaml     escreve SOMENTE a projeção para IA (graph.yaml), sem tocar
                no graph.json. É o modo de quem está escrevendo documentação
                e quer o panorama atualizado sem mexer no que o app lê.
     --stdout   com --yaml, imprime em vez de escrever em disco.
"""
import json
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path

import yaml


def _normalizar_datas(valor):
    """PyYAML lê `2026-07-24` como datetime.date; o contrato fala JSON, onde
    data é string ISO. Normaliza para o schema não acusar falso positivo."""
    if isinstance(valor, (date, datetime)):
        return valor.isoformat()
    if isinstance(valor, dict):
        return {k: _normalizar_datas(v) for k, v in valor.items()}
    if isinstance(valor, list):
        return [_normalizar_datas(v) for v in valor]
    return valor

BOX_DIRS = ["spine", "realizations", "systems", "data", "evidence", "problems"]
CONTEXT_DIRS = ["areas", "scenarios", "views"]
BOX_TYPES = {"spine", "realization", "system", "data", "evidence", "problem"}

RE_FRONT = re.compile(r"^---\n(.*?)\n---\n", re.S)
RE_H1 = re.compile(r"^# (.+)$", re.M)
RE_REL = re.compile(r"^- `([a-z-]+)` → \[\[([a-z][a-z0-9.-]*)(?:\|([^\]]+))?\]\]\s*$", re.M)
RE_WIKILINK = re.compile(r"^\[\[([a-z][a-z0-9.-]*)(?:\|[^\]]+)?\]\]$")


def parse_doc(path: Path):
    text = path.read_text(encoding="utf-8")
    m = RE_FRONT.match(text)
    if not m:
        raise ValueError(f"{path}: frontmatter ausente")
    front = _normalizar_datas(yaml.safe_load(m.group(1)))
    body = text[m.end():]
    h1 = RE_H1.search(body)
    sections = {}
    for sec in re.split(r"^## ", body, flags=re.M)[1:]:
        title, _, content = sec.partition("\n")
        sections[title.strip()] = content.strip()
    return {
        "front": front,
        "name": h1.group(1).strip() if h1 else front.get("id", path.stem),
        "definition": " ".join(sections.get("Definição", "").split()) or None,
        # Relações vivem no corpo INTEIRO, não só em "## Relações" — o próprio
        # template do Guia (§5.6) coloca `evidences`/`derived-from` sob
        # "## Evidências". Restringir a uma seção descartava arestas em silêncio.
        "relations": RE_REL.findall(body),
        "path": path,
    }


def wl_id(value):
    m = RE_WIKILINK.match(value or "")
    return m.group(1) if m else value


def construir(root: Path, schemas_dir: Path) -> dict:
    """Lê os Markdown de autoria e devolve o grafo em memória (sem escrever)."""
    registries = yaml.safe_load((schemas_dir / "registries.yaml").read_text(encoding="utf-8"))
    relation_types = registries["relation_types"]

    # O contrato de autoria (document.schema.json) é validado AQUI, doc a doc —
    # sem isto, todas as condicionais por tipo (spine sem areas, baseline só em
    # scenario, campos de view, enums de status) ficavam sem guardião (§14.1).
    doc_validator = None
    try:
        import jsonschema
        doc_schema = json.loads((schemas_dir / "document.schema.json").read_text(encoding="utf-8"))
        doc_validator = jsonschema.Draft202012Validator(doc_schema)
    except ImportError:
        pass

    docs, errors, warnings, gaps = [], [], [], []
    for d in BOX_DIRS + CONTEXT_DIRS:
        for path in sorted((root / d).rglob("*.md")) if (root / d).exists() else []:
            doc = parse_doc(path)
            fid = doc["front"].get("id")
            if path.stem != fid:
                errors.append({"code": "filename-id-mismatch",
                               "message": f"{path.name}: nome do arquivo ≠ id '{fid}'", "node": fid})
            if doc["front"].get("type") == "spine" and not doc["front"].get("spine_kind"):
                errors.append({"code": "spine-without-kind",
                               "message": f"{fid}: type spine sem spine_kind", "node": fid})
            if doc["front"].get("type") == "spine" and doc["front"].get("areas"):
                errors.append({"code": "spine-with-areas",
                               "message": f"{fid}: espinha não declara áreas — é independente do "
                                          "organograma (Guia §9.1); pertencimento é derivado das "
                                          "realizações", "node": fid})
            if doc["front"].get("type") not in BOX_TYPES | {"area", "scenario", "view"}:
                errors.append({"code": "unknown-type",
                               "message": f"{fid}: type '{doc['front'].get('type')}' não existe "
                                          "no contrato (§4)", "node": fid})
            if doc_validator is not None:
                for err in doc_validator.iter_errors(doc["front"]):
                    errors.append({"code": "frontmatter-invalid",
                                   "message": f"{fid}: {'/'.join(str(p) for p in err.path) or 'frontmatter'}"
                                              f" — {err.message[:120]}", "node": fid})
            docs.append(doc)

    ids = {d["front"]["id"]: d for d in docs}
    if len(ids) != len(docs):
        errors.append({"code": "duplicate-id", "message": "IDs duplicados na vault"})

    # Referências do frontmatter também precisam resolver (§14.1: "área
    # inexistente" e "cenário inexistente" são erros) — antes só as arestas
    # do corpo eram conferidas, e nuvem/baseline podiam apontar para fantasma.
    def _ref(fid, valor, tipo_esperado, campo):
        rid = wl_id(valor)
        alvo = ids.get(rid)
        if alvo is None:
            errors.append({"code": "unresolved-reference",
                           "message": f"{fid}: {campo} → {rid} não existe", "node": fid})
        elif alvo["front"].get("type") != tipo_esperado:
            errors.append({"code": "reference-wrong-type",
                           "message": f"{fid}: {campo} → {rid} não é {tipo_esperado}", "node": fid})

    for d in docs:
        f, fid = d["front"], d["front"]["id"]
        for a in f.get("areas", []):
            _ref(fid, a, "area", "areas")
        for s in f.get("scenarios", []):
            _ref(fid, s, "scenario", "scenarios")
        if f.get("baseline"):
            _ref(fid, f["baseline"], "scenario", "baseline")
        for sl in f.get("scenario_levels", []):
            if sl.get("scenario"):
                _ref(fid, sl["scenario"], "scenario", "scenario_levels")

    nodes, edges, areas, scenarios, views = [], [], [], [], []
    for d in docs:
        f, fid, ftype = d["front"], d["front"]["id"], d["front"]["type"]
        spine_kind = f.get("spine_kind")
        for rel, target, _title in d["relations"]:
            spec = relation_types.get(rel)
            if spec is None:
                errors.append({"code": "unknown-relation",
                               "message": f"{fid}: relação `{rel}` não registrada", "node": fid})
                continue
            if target not in ids:
                errors.append({"code": "unresolved-wikilink",
                               "message": f"{fid}: `{rel}` → {target} não resolvido", "node": fid})
                continue
            if rel == "related-to":
                warnings.append({"code": "related-to",
                                 "message": f"{fid} → {target}: relação provisória, refinar", "node": fid})
            tgt = ids[target]["front"]
            # Área e view nunca participam de aresta (§7.2: pertencimento é
            # propriedade, não seta; antipadrão "setas para áreas").
            if ftype in ("area", "view") or tgt["type"] in ("area", "view"):
                errors.append({"code": "edge-with-area",
                               "message": f"{fid} —{rel}→ {target}: área/view não entra em aresta "
                                          "(§7.2) — pertencimento se declara no frontmatter",
                               "node": fid})
                continue
            if rel == "replaces" and ftype != tgt["type"]:
                warnings.append({"code": "replaces-cross-family",
                                 "message": f"{fid} —replaces→ {target}: substituição entre famílias "
                                            f"diferentes ({ftype} → {tgt['type']}; Guia §6.4 pede a "
                                            "mesma família)", "node": fid})
            for side, doc_type, kind, allowed in (
                    ("origem", ftype, spine_kind, spec.get("from") or []),
                    ("destino", tgt["type"], tgt.get("spine_kind"), spec.get("to") or [])):
                if allowed and doc_type not in allowed and kind not in allowed:
                    warnings.append({"code": "atypical-relation",
                                     "message": f"{fid} —{rel}→ {target}: {side} fora do típico "
                                                f"({doc_type}/{kind}; típico: {allowed})", "node": fid})
            edges.append({"source": fid, "type": rel, "target": target})

        source = {"path": str(d["path"].relative_to(root))}
        if ftype in BOX_TYPES:
            node = {"id": fid, "type": ftype, "name": d["name"], "status": f["status"]}
            if spine_kind:
                node["spine_kind"] = spine_kind
            if f.get("confidence"):
                node["confidence"] = f["confidence"]
            if d["definition"]:
                node["definition"] = d["definition"]
            node["areas"] = [wl_id(a) for a in f.get("areas", [])]
            if f.get("scenarios"):
                node["scenarios"] = [wl_id(s) for s in f["scenarios"]]
            node["source"] = source
            nodes.append(node)
        elif ftype == "area":
            areas.append({"id": fid, "name": d["name"], "status": f["status"],
                          "definition": d["definition"] or "", "source": source})
        elif ftype == "scenario":
            scenarios.append({"id": fid, "name": d["name"], "status": f["status"],
                              "baseline": wl_id(f["baseline"]) if f.get("baseline") else None,
                              "definition": d["definition"] or "", "source": source})
        elif ftype == "view":
            views.append({"id": fid, "name": d["name"],
                          "scenario_levels": [{"level": sl["level"],
                                               "scenario": wl_id(sl["scenario"]) if sl.get("scenario") else None}
                                              for sl in f.get("scenario_levels", [])],
                          "visible_types": f.get("visible_types", []),
                          "show_area_clouds": f.get("show_area_clouds", True),
                          "show_area_edges": f.get("show_area_edges", False),
                          "source": source})

    linked = {e["source"] for e in edges} | {e["target"] for e in edges}
    realized = {e["target"] for e in edges if e["type"] == "realizes"}
    # Uma etapa de valor é coberta pela realização da CAPACIDADE que a habilita
    # — a espinha nunca realiza etapas direto (Guia §9.1). Só é lacuna a etapa
    # cuja capacidade habilitadora também está sem realização (buraco real).
    stage_covered = set(realized)
    for e in edges:
        if e["type"] == "enables" and e["source"] in realized:
            stage_covered.add(e["target"])
    for n in nodes:
        if n["id"] not in linked:
            warnings.append({"code": "orphan-node",
                             "message": f"{n['id']} não possui nenhuma relação tipada", "node": n["id"]})
        kind = n.get("spine_kind")
        if kind == "capability" and n["id"] not in realized:
            gaps.append({"code": "capability-without-realization",
                         "message": f"{n['id']} não possui realização em nenhum cenário", "node": n["id"]})
        elif kind == "value-stage" and n["id"] not in stage_covered:
            gaps.append({"code": "value-stage-uncovered",
                         "message": f"{n['id']} não tem realização nem capacidade habilitadora realizada",
                         "node": n["id"]})

    graph = {"schema_version": "0.2",
             "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
             "source": {"commit": None, "dirty": True},
             "nodes": nodes, "edges": edges, "areas": areas, "scenarios": scenarios,
             "views": views,
             "diagnostics": {"errors": errors, "warnings": warnings, "gaps": gaps}}

    return graph


def _projetar_yaml(graph: dict) -> str:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from graph_to_yaml import projetar
    return yaml.dump(projetar(graph), allow_unicode=True, sort_keys=False,
                     default_flow_style=False, width=100)


def _resumo(graph: dict) -> str:
    d = graph["diagnostics"]
    return (f'{len(graph["nodes"])} nós, {len(graph["edges"])} arestas, '
            f'{len(d["errors"])} erros, {len(d["warnings"])} avisos, {len(d["gaps"])} lacunas')


def main():
    argv = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    repo = Path(__file__).resolve().parent.parent
    root = Path(argv[0]) if argv else repo
    out_path = Path(argv[1]) if len(argv) > 1 else root / "generated" / "graph.json"
    # vault sem schemas/ própria (examples/cafeteria, por exemplo) reaproveita
    # a do repositório — antes era preciso apontar à mão, e ninguém lembrava
    schemas_dir = Path(argv[2]) if len(argv) > 2 else root / "schemas"
    if not (schemas_dir / "registries.yaml").exists():
        schemas_dir = repo / "schemas"

    graph = construir(root, schemas_dir)
    erros = graph["diagnostics"]["errors"]

    # --- modo "só o YAML": para quem está escrevendo documentação -----------
    # Não toca no graph.json de propósito: o app continua mostrando o último
    # estado compilado enquanto os Markdown estão em obra, e quem escreve
    # (pessoa ou agente) enxerga o panorama de agora.
    if "--yaml" in flags:
        texto = _projetar_yaml(graph)
        if "--stdout" in flags:
            print(texto)
        else:
            destino = out_path.with_suffix(".yaml")
            destino.parent.mkdir(parents=True, exist_ok=True)
            destino.write_text("# Gerado por build_graph.py — NÃO EDITAR (panorama para IA, CONTRATO §2.7).\n" + texto, encoding="utf-8")
            print(f"{destino}: panorama para IA ({len(texto.splitlines())} linhas) — {_resumo(graph)}")
        for e in erros:
            print(f"  ERRO {e['code']}: {e['message']}", file=sys.stderr)
        return 0   # escrever documentação com erro no meio é normal; não falha

    try:
        import jsonschema
        schema = json.loads((schemas_dir / "graph.schema.json").read_text(encoding="utf-8"))
        jsonschema.validate(graph, schema)
        print("graph.json válido contra schemas/graph.schema.json")
    except ImportError:
        print("aviso: jsonschema indisponível, validação pulada")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(graph, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{out_path}: {_resumo(graph)}")

    # A projeção para IA sai JUNTO, sempre. Gerada à parte, ela envelhecia sem
    # ninguém notar — e um agente lendo YAML velho é pior que agente sem YAML
    # (CONTRATO §2.7).
    texto = _projetar_yaml(graph)
    yaml_path = out_path.with_suffix(".yaml")
    yaml_path.write_text("# Gerado por build_graph.py — NÃO EDITAR (panorama para IA, CONTRATO §2.7).\n" + texto, encoding="utf-8")
    print(f"{yaml_path}: projeção para IA ({len(texto.splitlines())} linhas)")

    if erros:
        for e in erros:
            print(f"  ERRO {e['code']}: {e['message']}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
