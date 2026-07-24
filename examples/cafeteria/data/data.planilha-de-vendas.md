---
id: data.planilha-de-vendas
type: data
status: active
confidence: hypothesis
areas:
  - "[[area.financeiro|Financeiro]]"
scenarios:
  - "[[scenario.loja-unica|Loja única]]"
---

# Planilha de vendas

## Definição

Planilha mantida manualmente pela gerente, onde cada venda do dia é
lançada à mão a partir do que ela observa no balcão — uma segunda
contagem, paralela ao extrato da maquininha, usada para conferência.

## Papel no negócio

Registra a etapa de receber pagamento sob uma ótica manual. Existe
porque a maquininha não é integrada a nada; na prática, os dois totais
nem sempre batem.

## Relações

- `records` → [[value-stage.receber-pagamento|Receber pagamento]]
