---
id: invariant.caixa-sempre-conciliado
type: spine
spine_kind: invariant
status: active
confidence: hypothesis
areas:
  - "[[area.financeiro|Financeiro]]"
---

# Caixa sempre conciliado

## Definição

O que deve permanecer verdadeiro: a cada fechamento, o que entrou e o
que saiu do caixa batem com o que foi registrado.

## Papel no negócio

Protege a integridade financeira da loja, independentemente de quantos
meios de pagamento existam ou de quem feche o caixa. Vale pelos dois
lados: tanto o que se cobra do cliente quanto o que se paga a
fornecedores precisam estar reconhecidos no fechamento.

## Relações

- `constrains` → [[capability.processar-pagamentos|Processar pagamentos]]
- `constrains` → [[capability.honrar-compromissos-financeiros|Honrar compromissos financeiros]]
