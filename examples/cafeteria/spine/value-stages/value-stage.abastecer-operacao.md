---
id: value-stage.abastecer-operacao
type: spine
spine_kind: value-stage
status: active
confidence: hypothesis
---

# Abastecer operação

## Definição

Transformação necessária: o que era estoque de um fornecedor passa a
ser insumo sob custódia da operação, na quantidade e na condição de uso
que os próximos dias exigem. Termina quando o insumo está disponível
para consumo; decidir o que comprar e quanto é da capacidade que
habilita esta etapa, não dela.

Acontece por ciclo de reposição — semanal, diário ou contínuo, conforme
o modelo —, nunca por cliente atendido.

## Papel no negócio

É a primeira etapa do fluxo de valor. Sem insumos disponíveis, nenhuma
etapa seguinte pode acontecer.

## Exemplos de realizações contrastantes

Hipóteses ilustrativas para mostrar a invariância — o As-Is real do
exemplo está nas realizações ligadas a esta caixa.

- **Poderia ser realizada como entrega diária de um distribuidor
  único.** A loja mantém estoque perto de zero e recebe todo amanhecer
  o que vai usar no dia. Custa mais por unidade e transfere o risco de
  ruptura para quem entrega, mas dispensa espaço de armazenagem.
- **Poderia ser realizada como centro de distribuição próprio (modelo
  oposto).** A compra é feita em volume para várias lojas, o estoque
  fica concentrado fora do ponto de venda e a reposição vira
  transferência interna programada. A etapa continua sendo a mesma
  passagem de custódia; muda apenas quem detém o insumo até a véspera
  do uso.

## Relações

- `advances` → [[value-stage.preparar-loja|Preparar loja]]
- `requires` → [[event.entrega-de-insumos-aceita|Entrega de insumos aceita]]

## Fonte

Nota de modelagem sobre a aresta `requires` → o evento: o vocabulário
de relações do Guia §6.4 não tem "evento produz etapa", então o elo é
escrito no sentido inverso — da etapa para o evento que ela pressupõe,
já que a etapa só se conclui se a custódia dos insumos tiver sido
reconhecida.
