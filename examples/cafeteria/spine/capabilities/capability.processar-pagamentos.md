---
id: capability.processar-pagamentos
type: spine
spine_kind: capability
status: active
confidence: hypothesis
areas:
  - "[[area.financeiro|Financeiro]]"
---

# Processar pagamentos

## Definição

Capacidade de cobrar do cliente o valor correto no ato da venda e
reconhecer esse recebimento no caixa. É o lado de contas a receber do
financeiro — pagar fornecedores é a capacidade separada de honrar
compromissos financeiros.

## Papel no negócio

Sustenta a etapa de receber pagamento e é a capacidade sobre a qual o
invariante de caixa conciliado se apoia pelo lado da entrada de dinheiro.

## Relações

- `enables` → [[value-stage.receber-pagamento|Receber pagamento]]
