---
id: realization.conferencia-de-caixa-no-fechamento
type: realization
status: active
confidence: hypothesis
areas:
  - "[[area.financeiro|Financeiro]]"
  - "[[area.operacoes|Operações]]"
scenarios:
  - "[[scenario.loja-unica|Loja única]]"
  - "[[scenario.loja-inteligente|Loja inteligente]]"
---

# Conferência de caixa no fechamento

## Definição

Ao final do dia, a pessoa responsável pelo fechamento soma manualmente
o extrato da maquininha e compara com o total anotado na planilha de
vendas, lançando a diferença — quando existe — em uma célula de
"ajuste".

## Papel no negócio

É a forma atual de tentar manter o caixa conciliado. Depende de duas
fontes que não conversam entre si: a maquininha e a planilha.

## Relações

- `realizes` → [[invariant.caixa-sempre-conciliado|Caixa sempre conciliado]]
- `uses` → [[data.planilha-de-vendas|Planilha de vendas]]
