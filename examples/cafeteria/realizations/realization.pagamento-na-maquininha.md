---
id: realization.pagamento-na-maquininha
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

# Pagamento na maquininha

## Definição

A cobrança é feita na maquininha de cartão ao final do pedido, sem
integração com o restante da operação.

## Papel no negócio

É a forma atual de materializar o processamento de pagamentos. O valor
cobrado depende do que o operador de caixa digita manualmente.

## Relações

- `realizes` → [[capability.processar-pagamentos|Processar pagamentos]]
