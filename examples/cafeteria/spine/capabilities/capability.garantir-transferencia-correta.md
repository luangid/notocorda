---
id: capability.garantir-transferencia-correta
type: spine
spine_kind: capability
status: active
confidence: hypothesis
---

# Garantir transferência correta

## Definição

Capacidade de assegurar que o produto certo chega à posse do cliente
certo, qualquer que seja o meio de transferência — balcão, entrega,
retirada ou qualquer outro ponto de coleta. A etapa que ela habilita
(*Transferir posse ao cliente*) exige que a posse passe; é esta
capacidade que exige que passe para quem pediu, e só para ele.

Não se mede num pedido isolado: ela aparece quando há mais de um pedido
em jogo ao mesmo tempo — o balcão cheio, a rota com várias entregas —,
e é por isso que costuma parecer desnecessária fora do pico.

## Papel no negócio

Sustenta a etapa de transferir posse ao cliente. Sem esta capacidade, a
loja não tem como garantir que pedidos não se troquem entre clientes
quando há mais de um pedido pronto ao mesmo tempo.

## Exemplos de realizações contrastantes

Hipóteses ilustrativas para mostrar a invariância — o As-Is real do
exemplo está nas realizações ligadas a esta caixa.

- **Poderia ser realizada como senha numerada impressa no pedido.** O
  número do ticket e o número anunciado precisam coincidir, e o cliente
  guarda a prova do que é dele. Custa uma bobina de papel e resolve a
  troca de pedidos sem depender de ninguém lembrar nome nenhum.
- **Poderia ser realizada como conferência de identidade na entrega a
  domicílio (modelo oposto).** Quem entrega confere o código do pedido
  com o cliente na porta, longe da loja e sem fila nenhuma por perto. A
  correção deixa de depender do que acontece no balcão e passa a
  depender de quem nem trabalha lá.

## Relações

- `enables` → [[value-stage.transferir-posse-ao-cliente|Transferir posse ao cliente]]

## Problemas ou questões abertas

Hoje a transferência é garantida só por chamada de nome no balcão
(*Entrega por chamada no balcão*), que fica frágil no pico, quando
vários pedidos ficam prontos ao mesmo tempo e podem se trocar.
