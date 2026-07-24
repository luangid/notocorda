---
id: realization.pedido-no-balcao
type: realization
status: active
confidence: certified
areas:
  - "[[area.operacoes|Operações]]"
scenarios:
  - "[[scenario.loja-unica|Loja única]]"
---

# Pedido no balcão

## Definição

O cliente informa o pedido diretamente ao barista no balcão.

## Relações

- `realizes` → [[capability.gerenciar-pedidos|Gerenciar pedidos]]
- `uses` → [[data.registro-manual-de-pedidos|Registro manual de pedidos]]

## Evidências

- `evidences` → declarada no lado da evidência
  ([[evidence.entrevista-gerente-loja-2026-07|Entrevista com gerente da loja]]) —
  o backlink aparece aqui por derivação, nunca é escrito à mão.
