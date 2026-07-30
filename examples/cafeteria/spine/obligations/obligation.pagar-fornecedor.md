---
id: obligation.pagar-fornecedor
type: spine
spine_kind: obligation
status: active
confidence: hypothesis
---

# Pagar fornecedor

## Definição

O que se torna devido: a contraprestação financeira criada quando a
loja aceita uma entrega de insumos. A obrigação não é o ato de pagar —
é o estado que existe entre o aceite que a cria e a quitação que a
extingue, e existe mesmo que ninguém a tenha anotado em lugar nenhum.

Nasce por entrega aceita e se extingue uma vez cada, na quitação. Quem
lhe dá data é o prazo negociado com o fornecedor, não o calendário da
loja.

## Papel no negócio

É a obrigação que fecha o ciclo com o fornecedor. Depende da capacidade
de honrar compromissos financeiros — o lado de contas a pagar do
financeiro — para ser liquidada no prazo, e não da capacidade de cobrar
o cliente: dinheiro que sai e dinheiro que entra são fluxos distintos.

## Exemplos de realizações contrastantes

Hipóteses ilustrativas para mostrar a invariância — o As-Is real do
exemplo está nas realizações ligadas a esta caixa.

- **Poderia ser realizada como título individual por entrega.** Cada
  aceite gera um documento com valor e vencimento próprios, que se
  acompanha um a um até a baixa. A obrigação fica visível desde o
  primeiro dia e o esforço é de controle.
- **Poderia ser realizada como saldo em conta corrente com o
  fornecedor (modelo oposto).** As entregas do período se somam num
  saldo único, fechado e quitado de uma vez. O dever continua nascendo
  a cada entrega aceita, mas deixa de ser visível uma a uma — e a loja
  troca controle fino por menos papel.

## Relações

- `requires` → [[capability.honrar-compromissos-financeiros|Honrar compromissos financeiros]]
