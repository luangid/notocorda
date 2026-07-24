---
id: event.entrega-de-insumos-aceita
type: spine
spine_kind: event
status: active
confidence: hypothesis
areas:
  - "[[area.suprimentos|Suprimentos]]"
---

# Entrega de insumos aceita

## Definição

Acontecimento relevante: a loja reconhece o recebimento de insumos
enviados por um fornecedor.

## Papel no negócio

Marca a transição entre "insumo pedido" e "insumo disponível", e é o
gatilho que faz nascer a obrigação de pagamento ao fornecedor.

## Relações

- `creates` → [[obligation.pagar-fornecedor|Pagar fornecedor]]
