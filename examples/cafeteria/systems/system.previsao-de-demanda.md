---
id: system.previsao-de-demanda
type: system
status: draft
confidence: hypothesis
areas:
  - "[[area.transformacao-digital|Transformação Digital]]"
scenarios:
  - "[[scenario.loja-inteligente|Loja inteligente]]"
---

# Previsão de demanda

## Definição

Modelo simples de previsão de consumo por item e dia da semana,
proposto para o cenário To-Be "Suprimento inteligente".

## Papel no negócio

Apoiaria a reposição automática de insumos, usando o histórico de
vendas como principal insumo de dados.

## Relações

- `supports` → [[realization.reposicao-automatica-de-insumos|Reposição automática de insumos]]
- `uses` → [[data.historico-de-vendas|Histórico de vendas]]
