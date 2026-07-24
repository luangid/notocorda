---
id: value-stage.receber-pagamento
type: spine
spine_kind: value-stage
status: active
confidence: hypothesis
areas:
  - "[[area.financeiro|Financeiro]]"
---

# Receber pagamento

## Definição

Transformação necessária: o pagamento é recebido e reconhecido pela
operação.

## Papel no negócio

Converte a entrega em receita reconhecida. Sustenta o invariante de
caixa sempre conciliado.

## Relações

- `advances` → [[value-stage.fidelizar-cliente|Fidelizar cliente]]
