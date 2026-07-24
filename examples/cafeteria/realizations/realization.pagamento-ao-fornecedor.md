---
id: realization.pagamento-ao-fornecedor
type: realization
status: active
confidence: hypothesis
areas:
  - "[[area.financeiro|Financeiro]]"
  - "[[area.suprimentos|Suprimentos]]"
scenarios:
  - "[[scenario.loja-unica|Loja única]]"
  - "[[scenario.loja-inteligente|Loja inteligente]]"
---

# Pagamento ao fornecedor

## Definição

A gerente paga cada fornecedor pelo aplicativo do banco, por boleto ou
PIX, na data combinada na negociação — em geral a partir do valor
anotado na nota que veio com a entrega. Não há contas a pagar formal:
os vencimentos ficam na memória e na conversa do grupo de WhatsApp.

## Papel no negócio

É a forma atual de honrar os compromissos financeiros com fornecedores.
Cumpre a obrigação criada quando a loja aceita uma entrega, mas depende
inteiramente da gerente lembrar cada vencimento — quando ela falta, o
pagamento pode atrasar.

## Relações

- `realizes` → [[capability.honrar-compromissos-financeiros|Honrar compromissos financeiros]]
