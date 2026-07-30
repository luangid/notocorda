---
id: capability.honrar-compromissos-financeiros
type: spine
spine_kind: capability
status: active
confidence: hypothesis
---

# Honrar compromissos financeiros

## Definição

Capacidade de liquidar as obrigações financeiras da loja — pagar
fornecedores e demais contas devidas — no valor e no prazo acordados.
Não cria a obrigação nem decide se ela existe: recebe o que já é devido
e o leva até a quitação.

É cobrada uma vez por obrigação em aberto, no prazo de cada uma, e não
por dia de operação — o que a torna invisível justamente nos dias em
que nada vence.

## Papel no negócio

É o lado de contas a pagar do financeiro, distinto de cobrar o cliente:
quando um evento econômico cria uma obrigação (aceitar uma entrega cria
o dever de pagar o fornecedor), é esta capacidade que a leva à
liquidação. Separá-la de *Processar pagamentos* deixa explícito que
dinheiro que sai e dinheiro que entra são fluxos diferentes, ainda que
ambos passem pelo mesmo caixa.

## Papel na espinha

Não habilita uma etapa de valor neste exemplo: o fluxo de valor da
cafeteria termina em fidelizar o cliente e não tem uma etapa dedicada a
"fechar as contas". A capacidade é puxada pela obrigação que a requer
(*Pagar fornecedor*) e materializada pela realização que a cumpre. Numa
operação maior, a capacidade equivalente costuma habilitar uma etapa
dedicada a medir, faturar e receber; aqui ela apenas quita a obrigação
que o evento cria.

## Exemplos de realizações contrastantes

Hipóteses ilustrativas para mostrar a invariância — o As-Is real do
exemplo está nas realizações ligadas a esta caixa.

- **Poderia ser realizada como quitação à vista na própria entrega.**
  Cada entrega é paga no ato contra a nota, e a loja nunca deve nada a
  ninguém. Elimina o controle de vencimentos e cobra o preço em capital
  de giro parado.
- **Poderia ser realizada como financeiro centralizado numa matriz
  (modelo oposto).** A loja apenas confirma que a entrega foi aceita e
  quem paga é a matriz, que depois debita o resultado da unidade. A
  obrigação continua exigindo a capacidade; ela é que passou a ser
  exercida a quilômetros de distância de quem recebeu o insumo.

## Problemas ou questões abertas

O invariante *Caixa sempre conciliado* restringe esta capacidade (ver o
próprio invariante): tanto o que sai quanto o que entra precisam bater
no fechamento. Se a governança criar uma etapa de valor financeira,
reavaliar se esta capacidade passa a habilitá-la.
