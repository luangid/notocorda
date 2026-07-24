---
id: problem.caixa-que-nao-fecha
type: problem
status: active
confidence: certified
areas:
  - "[[area.financeiro|Financeiro]]"
scenarios:
  - "[[scenario.loja-unica|Loja única]]"
---

# Caixa que não fecha

## Definição

Em parte dos fechamentos, o total da maquininha e o total da planilha
de vendas não batem, e a diferença é lançada como "ajuste" sem
investigação da causa.

## Relações

- `affects` → [[invariant.caixa-sempre-conciliado|Caixa sempre conciliado]]
- `motivates` → [[scenario.loja-inteligente|Loja inteligente]]

## Evidências

- `evidences` → declarada no lado da evidência
  ([[evidence.planilha-fechamento-caixa-2026-06|Planilha de fechamento de caixa]]).

## Problemas ou questões abertas

Não está confirmado se a divergência vem de erro de digitação na
planilha, de estorno não registrado ou de outra causa — nenhuma delas
foi isolada ainda.
