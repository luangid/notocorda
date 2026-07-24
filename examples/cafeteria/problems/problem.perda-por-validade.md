---
id: problem.perda-por-validade
type: problem
status: active
confidence: certified
areas:
  - "[[area.operacoes|Operações]]"
  - "[[area.suprimentos|Suprimentos]]"
scenarios:
  - "[[scenario.loja-unica|Loja única]]"
---

# Perda por validade

## Definição

Parte dos insumos comprados na compra semanal vence na prateleira antes
de ser usada, principalmente leite e itens de padaria, gerando descarte
recorrente.

## Relações

- `affects` → [[invariant.insumo-vencido-nao-utilizado|Insumo vencido não é utilizado]]
- `motivates` → [[scenario.loja-inteligente|Loja inteligente]]

## Evidências

- `evidences` → declarada no lado da evidência
  ([[evidence.foto-estoque-2026-05|Fotos de estoque]]).

## Problemas ou questões abertas

Sintoma observado é o descarte; causa provável é a compra por
estimativa sem previsão de demanda item a item — a mesma causa
suspeita da ruptura de estoque, no sentido oposto.
