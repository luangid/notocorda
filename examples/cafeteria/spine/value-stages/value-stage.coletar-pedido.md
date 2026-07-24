---
id: value-stage.coletar-pedido
type: spine
spine_kind: value-stage
status: active
confidence: hypothesis
areas:
  - "[[area.operacoes|Operações]]"
---

# Coletar pedido

## Definição

Transformação necessária: a intenção de compra do cliente é capturada
de forma acionável, qualquer que seja o canal — balcão, totem,
aplicativo ou qualquer outro meio ainda não inventado.

## Papel no negócio

Converte a intenção de compra em um compromisso operacional conhecido,
que pode ser produzido e entregue. Não pressupõe que exista uma pessoa
atendendo: só que o pedido vire uma informação confiável para a etapa
seguinte.

## Relações

- `advances` → [[value-stage.disponibilizar-produto|Disponibilizar produto]]
