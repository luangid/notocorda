---
id: realization.controle-de-validade-na-prateleira
type: realization
status: active
confidence: hypothesis
areas:
  - "[[area.operacoes|Operações]]"
scenarios:
  - "[[scenario.loja-unica|Loja única]]"
  - "[[scenario.loja-inteligente|Loja inteligente]]"
---

# Controle de validade na prateleira

## Definição

A equipe organiza os insumos na prateleira por ordem de validade (o
mais próximo do vencimento na frente) e confere visualmente antes de
cada turno. Não há etiqueta, planilha ou sistema de apoio — só a
rotina de quem está de plantão.

## Papel no negócio

É a única barreira atual contra o uso de insumo vencido. Funciona bem
quando a equipe está atenta e falha quando o turno está sobrecarregado.

## Relações

- `realizes` → [[invariant.insumo-vencido-nao-utilizado|Insumo vencido não é utilizado]]
