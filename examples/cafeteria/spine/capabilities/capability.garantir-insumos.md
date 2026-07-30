---
id: capability.garantir-insumos
type: spine
spine_kind: capability
status: active
confidence: hypothesis
---

# Garantir insumos

## Definição

Capacidade de acertar o que comprar, quanto e quando, de modo que o
insumo certo esteja no ponto de uso antes de a operação precisar dele.
A etapa que ela habilita (*Abastecer operação*) é o movimento do insumo
até a custódia da loja; a capacidade é o acerto da decisão que dispara
esse movimento. Sem ela o insumo até chega — na hora errada ou na
quantidade errada.

Não acontece num momento do fluxo: é cobrada toda vez que alguém
estende a mão para pegar um insumo e ele precisa estar lá.

## Papel no negócio

Sustenta a etapa de abastecer a operação. Sem esta capacidade, a loja
não consegue prometer o que está no cardápio de forma confiável.

## Exemplos de realizações contrastantes

Hipóteses ilustrativas para mostrar a invariância — o As-Is real do
exemplo está nas realizações ligadas a esta caixa.

- **Poderia ser realizada como ponto de pedido marcado na
  prateleira.** Uma fita marca o nível mínimo de cada item e quem vê o
  estoque descer abaixo dela escreve na lista de compras. A decisão
  fica distribuída pela equipe, sem previsão e sem histórico.
- **Poderia ser realizada como estoque consignado do fornecedor
  (modelo oposto).** O fornecedor mantém o estoque dentro da loja,
  repõe por conta própria e cobra só o que foi consumido. A decisão de
  quanto e quando sai da loja, mas a capacidade não deixa de ser
  exigida — ela passa a ser exercida por terceiro, e o risco de acerto
  vai junto.

## Relações

- `enables` → [[value-stage.abastecer-operacao|Abastecer operação]]
