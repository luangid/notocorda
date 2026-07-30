---
id: value-stage.coletar-pedido
type: spine
spine_kind: value-stage
status: active
confidence: hypothesis
---

# Coletar pedido

## Definição

Transformação necessária: a intenção de compra do cliente é capturada
de forma acionável, qualquer que seja o canal — balcão, totem,
aplicativo ou qualquer outro meio ainda não inventado. Termina quando o
pedido existe como objeto para as etapas seguintes; acompanhá-lo dali
em diante é da capacidade que habilita esta etapa, não dela.

Acontece uma vez por pedido: é o ato que faz o pedido passar a existir.

## Papel no negócio

Converte a intenção de compra em um compromisso operacional conhecido,
que pode ser produzido e entregue. Não pressupõe que exista uma pessoa
atendendo: só que o pedido vire uma informação confiável para a etapa
seguinte.

## Exemplos de realizações contrastantes

Hipóteses ilustrativas para mostrar a invariância — o As-Is real do
exemplo está nas realizações ligadas a esta caixa.

- **Poderia ser realizada como comanda de papel anotada na mesa.** Quem
  atende escreve o pedido e ele vira um objeto físico que precisa
  circular até quem produz; sem o papel na mão, a etapa seguinte não
  sabe o que fazer.
- **Poderia ser realizada como assinatura recorrente, sem ato de pedir
  (modelo oposto).** O cliente contrata "um café por dia útil" e a
  coleta passa a ser uma regra de calendário em vez de uma conversa. A
  intenção continua tendo de virar compromisso acionável, e a etapa
  continua acontecendo uma vez por pedido — só que o pedido nasce do
  contrato, não da visita.

## Relações

- `advances` → [[value-stage.disponibilizar-produto|Disponibilizar produto]]
