---
id: realization.reposicao-automatica-de-insumos
type: realization
status: draft
confidence: hypothesis
areas:
  - "[[area.suprimentos|Suprimentos]]"
  - "[[area.transformacao-digital|Transformação Digital]]"
scenarios:
  - "[[scenario.loja-inteligente|Loja inteligente]]"
---

# Reposição automática de insumos

## Definição

Pedido de compra sugerido automaticamente a partir de uma previsão de
demanda por item e dia da semana, substituindo a estimativa manual.

## Papel no negócio

Proposta de nova forma de garantir insumos, direcionada a reduzir
ruptura de estoque sem depender apenas da experiência de quem compra.

## Relações

- `realizes` → [[capability.garantir-insumos|Garantir insumos]]
- `replaces` → [[realization.compra-semanal-de-insumos|Compra semanal de insumos]]
- `uses` → [[data.demanda-prevista|Demanda prevista]]
- `mitigates` → [[problem.ruptura-de-estoque|Ruptura de estoque]]
