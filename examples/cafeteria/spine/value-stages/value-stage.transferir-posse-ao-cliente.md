---
id: value-stage.transferir-posse-ao-cliente
type: spine
spine_kind: value-stage
status: active
confidence: hypothesis
---

# Transferir posse ao cliente

## Definição

Transformação necessária: a posse do produto passa para o cliente
certo — por entrega, retirada no balcão, coleta em um ponto de encontro
ou qualquer outro meio. Termina quando o produto está com quem o
pediu; assegurar que seja o cliente certo é da capacidade que habilita
esta etapa, não dela.

Acontece por pedido, e não por item: os três itens de um mesmo pedido
mudam de posse numa entrega só.

## Papel no negócio

Fecha o ciclo de produção sem presumir que a loja precise entregar
ativamente o produto. Uma transferência errada ou lenta desfaz o valor
criado nas etapas anteriores.

## Exemplos de realizações contrastantes

Hipóteses ilustrativas para mostrar a invariância — o As-Is real do
exemplo está nas realizações ligadas a esta caixa.

- **Poderia ser realizada como entrega na mesa por quem atende.** Quem
  serviu leva o pedido até o cliente sentado; a posse passa sem que o
  cliente saia do lugar, e o custo é o de manter alguém circulando pelo
  salão.
- **Poderia ser realizada como armário de retirada com código (modelo
  oposto).** O produto fica num compartimento que só abre com o código
  do pedido, e ninguém da loja participa do momento da transferência. A
  etapa continua existindo e é a mesma; muda o que a torna correta —
  um código no lugar de um nome reconhecido.

## Relações

- `advances` → [[value-stage.receber-pagamento|Receber pagamento]]

## Problemas ou questões abertas

Nenhuma realização documentada realiza esta etapa diretamente, em
nenhum cenário: o As-Is da transferência aparece só pendurado na
capacidade que a habilita (*Entrega por chamada no balcão*). Falta
decidir se a etapa merece realização própria — o ponto de retirada, o
fluxo de saída — ou se ela é inteiramente absorvida pela capacidade.
Enquanto não se decide, a lacuna é intencional e serve de exemplo:
etapa sem realização é informação, não esquecimento (Guia §3.8).
