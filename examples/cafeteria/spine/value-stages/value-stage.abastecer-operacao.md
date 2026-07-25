---
id: value-stage.abastecer-operacao
type: spine
spine_kind: value-stage
status: active
confidence: hypothesis
---

# Abastecer operação

## Definição

Transformação necessária: insumos disponíveis na loja, na quantidade e
na condição necessárias para operar o dia.

## Papel no negócio

É a primeira etapa do fluxo de valor. Sem insumos disponíveis, nenhuma
etapa seguinte pode acontecer.

## Relações

- `advances` → [[value-stage.preparar-loja|Preparar loja]]
- `requires` → [[event.entrega-de-insumos-aceita|Entrega de insumos aceita]]

## Fonte

A aresta `requires` → o evento segue a mesma convenção da espinha real
(etapa exige que a custódia dos insumos tenha sido reconhecida): o
vocabulário do Guia §6.4 não tem "evento produz etapa", então o elo é
modelado no sentido inverso, da etapa para o evento que ela pressupõe.
