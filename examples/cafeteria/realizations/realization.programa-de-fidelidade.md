---
id: realization.programa-de-fidelidade
type: realization
status: draft
confidence: hypothesis
areas:
  - "[[area.operacoes|Operações]]"
  - "[[area.transformacao-digital|Transformação Digital]]"
scenarios:
  - "[[scenario.loja-inteligente|Loja inteligente]]"
---

# Programa de fidelidade

## Definição

Programa de pontos e recompensas calculado a partir do histórico de
compras do cliente no aplicativo.

## Papel no negócio

Proposta de nova forma de materializar a fidelização. É, ao mesmo
tempo, a primeira realização que dá à loja a capacidade de conhecer o
cliente — hoje inexistente — porque o histórico de compras por pessoa
só passa a existir com o aplicativo.

## Relações

- `realizes` → [[capability.conhecer-o-cliente|Conhecer o cliente]]
- `realizes` → [[value-stage.fidelizar-cliente|Fidelizar cliente]]
- `uses` → [[data.pedidos-do-aplicativo|Pedidos do aplicativo]]
