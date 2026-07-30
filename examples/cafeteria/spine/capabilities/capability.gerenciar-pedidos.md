---
id: capability.gerenciar-pedidos
type: spine
spine_kind: capability
status: active
confidence: hypothesis
---

# Gerenciar pedidos

## Definição

Capacidade de registrar, acompanhar e coordenar pedidos desde sua
solicitação até a entrega ou resolução — inclusive os que terminam
cancelados, trocados ou devolvidos. A etapa que ela habilita (*Coletar
pedido*) termina no instante em que a intenção vira compromisso
conhecido; a capacidade continua depois disso, enquanto houver pedido
em aberto.

É cobrada de forma contínua durante a operação e cresce com o número de
pedidos simultâneos, não com o número de clientes do dia.

## Papel no negócio

Transforma a intenção do cliente em compromisso operacional conhecido.

## Exemplos de realizações contrastantes

Hipóteses ilustrativas para mostrar a invariância — o As-Is real do
exemplo está nas realizações ligadas a esta caixa.

- **Poderia ser realizada como fila única de comandas espetadas.** A
  ordem de chegada é a única coordenação que existe: a comanda mais
  antiga está por baixo no espeto e nada distingue um pedido urgente de
  um demorado. Custa nada e não sobrevive a dois canais de venda.
- **Poderia ser realizada como despacho por praças com prioridade
  calculada (modelo oposto).** Cada item vai para a estação que o
  produz e a ordem é decidida por tempo de preparo, para que os itens
  de um mesmo pedido fiquem prontos juntos. A capacidade é a mesma; o
  que muda é quanto pedido simultâneo ela aguenta.

## Relações

- `enables` → [[value-stage.coletar-pedido|Coletar pedido]]
