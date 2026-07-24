---
id: realization.entrega-por-chamada-no-balcao
type: realization
status: active
confidence: hypothesis
areas:
  - "[[area.operacoes|Operações]]"
scenarios:
  - "[[scenario.loja-unica|Loja única]]"
  - "[[scenario.loja-inteligente|Loja inteligente]]"
---

# Entrega por chamada no balcão

## Definição

Quando a bebida fica pronta, o barista chama em voz alta o nome
anotado na comanda e entrega no balcão de retirada. Um só ponto de
entrega, sem senha impressa nem tela de chamada.

## Papel no negócio

É a forma atual de garantir que o produto certo chega ao cliente certo.
Funciona enquanto há poucos pedidos prontos ao mesmo tempo; no pico, com
vários nomes chamados em sequência, pedidos podem se trocar — é o ponto
frágil que uma senha ou uma tela de retirada endereçariam.

## Relações

- `realizes` → [[capability.garantir-transferencia-correta|Garantir transferência correta]]
