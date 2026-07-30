---
id: value-stage.receber-pagamento
type: spine
spine_kind: value-stage
status: active
confidence: hypothesis
---

# Receber pagamento

## Definição

Transformação necessária: o valor devido pelo pedido sai do cliente e
entra reconhecido no caixa da operação. São dois movimentos que a etapa
exige juntos — o dinheiro muda de mãos e o recebimento passa a constar
de onde a operação lê seu resultado. Um sem o outro deixa a etapa pela
metade: dinheiro na gaveta que ninguém registrou não virou receita
reconhecida.

Acontece uma vez por pedido, mesmo quando o cliente divide o valor em
duas formas de pagamento.

## Papel no negócio

Converte a entrega em receita reconhecida. É aqui que o invariante de
caixa sempre conciliado ganha ou perde matéria: o que não for
reconhecido nesta etapa não terá como bater no fechamento.

## Exemplos de realizações contrastantes

Hipóteses ilustrativas para mostrar a invariância — o As-Is real do
exemplo está nas realizações ligadas a esta caixa.

- **Poderia ser realizada como dinheiro na gaveta.** Sem intermediário
  e sem prazo: o valor entra no ato e o reconhecimento é a contagem
  física no fim do dia. Simples de operar e frágil quanto ao segundo
  movimento, porque nada obriga o registro a acontecer.
- **Poderia ser realizada como conta mensal pós-paga (modelo oposto).**
  O cliente consome durante o mês e paga uma fatura depois. Os dois
  movimentos continuam sendo exigidos, mas separam-se no tempo — o
  reconhecimento acontece no consumo e a entrada de dinheiro, semanas
  adiante.

## Relações

- `advances` → [[value-stage.fidelizar-cliente|Fidelizar cliente]]

## Problemas ou questões abertas

O eixo de valor coloca esta etapa depois de *Transferir posse ao
cliente*, mas na operação de balcão o cliente costuma pagar antes de
receber a bebida. A pergunta em aberto é o que `advances` afirma: se
ordem no tempo, a sequência está errada; se dependência de valor — só
há o que reconhecer porque houve o que entregar —, está certa e a
inversão temporal é escolha da realização. Decidir isso vale para todo
o eixo, não só para esta caixa.
