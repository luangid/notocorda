---
id: event.entrega-de-insumos-aceita
type: spine
spine_kind: event
status: active
confidence: hypothesis
---

# Entrega de insumos aceita

## Definição

Acontecimento relevante: a loja reconhece o recebimento de insumos
enviados por um fornecedor. O que o evento marca é o reconhecimento,
não a chegada física — caixa parada na porta ainda não é entrega
aceita, e é por isso que existe um instante identificável em que a
custódia muda de lado.

Acontece por entrega, não por pedido de compra: um pedido dividido em
duas entregas produz dois aceites — e, portanto, duas obrigações.

## Papel no negócio

Marca a transição entre "insumo pedido" e "insumo disponível", e é o
gatilho que faz nascer a obrigação de pagamento ao fornecedor.

## Exemplos de realizações contrastantes

Hipóteses ilustrativas para mostrar a invariância — o As-Is real do
exemplo está nas realizações ligadas a esta caixa.

- **Poderia ser realizado como assinatura do canhoto na porta.** O
  aceite é instantâneo e integral: quem recebe assina sem conferir item
  a item, e qualquer divergência vira negociação depois. A operação não
  para, e o risco fica todo do lado de quem assinou.
- **Poderia ser realizado como aceite em duas fases, com quarentena
  (modelo oposto).** A carga entra bloqueada, é conferida contra o
  pedido e só então aceita. Entre a chegada e o aceite, o insumo está
  fisicamente na loja mas ainda não é dela — e o dever de pagar ainda
  não nasceu.

## Relações

- `creates` → [[obligation.pagar-fornecedor|Pagar fornecedor]]
