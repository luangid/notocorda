---
id: problem.ruptura-de-estoque
type: problem
status: active
confidence: certified
areas:
  - "[[area.operacoes|Operações]]"
  - "[[area.suprimentos|Suprimentos]]"
scenarios:
  - "[[scenario.loja-unica|Loja única]]"
---

# Ruptura de estoque

## Definição

Indisponibilidade de insumo necessário para atender a demanda.

## Relações

- `affects` → [[capability.garantir-insumos|Garantir insumos]]
- `affects` → [[realization.compra-semanal-de-insumos|Compra semanal de insumos]]
- `motivates` → [[scenario.loja-inteligente|Loja inteligente]]

## Problemas ou questões abertas

Causa provável (compra por estimativa) ainda não confirmada item a item.
