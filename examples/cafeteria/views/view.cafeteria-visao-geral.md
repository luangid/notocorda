---
id: view.cafeteria-visao-geral
type: view
status: active

scenario_levels:
  - level: -1
    scenario: "[[scenario.loja-unica|Loja única]]"
  - level: 0
    scenario: null
  - level: 1
    scenario: "[[scenario.loja-inteligente|Loja inteligente]]"

visible_types:
  - spine
  - realization
  - system
  - data
  - evidence
  - problem

show_area_clouds: true
show_area_edges: false
---

# Cafeteria — visão geral

Níveis do seletor pertencem a esta view, não aos cenários (Guia §8.3).
O nível 0 (`scenario: null`) é a espinha dorsal. Posições manuais, quando
salvas pelo viewer, entram em `layout:` neste arquivo.
