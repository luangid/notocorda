---
id: realization.pedido-pelo-app
type: realization
status: draft
confidence: hypothesis
areas:
  - "[[area.operacoes|Operações]]"
  - "[[area.transformacao-digital|Transformação Digital]]"
scenarios:
  - "[[scenario.loja-inteligente|Loja inteligente]]"
---

# Pedido pelo app

## Definição

O cliente registra e acompanha o pedido pelo aplicativo, sem precisar
falar com o barista no balcão.

## Papel no negócio

Proposta de nova forma de materializar a gestão de pedidos, pensada
para reduzir fila no horário de pico e substituir o pedido no balcão.

## Relações

- `realizes` → [[capability.gerenciar-pedidos|Gerenciar pedidos]]
- `uses` → [[data.pedidos-do-aplicativo|Pedidos do aplicativo]]
- `replaces` → [[realization.pedido-no-balcao|Pedido no balcão]]
