---
id: value-stage.disponibilizar-produto
type: spine
spine_kind: value-stage
status: active
confidence: hypothesis
---

# Disponibilizar produto

## Definição

Transformação necessária: o produto do pedido fica pronto para ser
passado ao cliente — seja produzido na hora, montado a partir de
insumos, ou obtido já pronto, por exemplo comprado de terceiros para
revenda. Termina com o produto pronto; que ele saia igual ao de ontem é
da capacidade que habilita esta etapa, não dela.

Acontece por item do pedido: um pedido com dois cafés e um pão passa
três vezes por esta etapa e uma só pela seguinte.

## Papel no negócio

É onde o pedido vira produto, qualquer que seja o método escolhido. A
espinha não presume que a loja precise fabricar o que vende para
cumprir esta etapa.

## Exemplos de realizações contrastantes

Hipóteses ilustrativas para mostrar a invariância — o As-Is real do
exemplo está nas realizações ligadas a esta caixa.

- **Poderia ser realizada como preparo sob encomenda por barista.**
  Nada existe antes do pedido: o produto é montado item a item depois
  que a comanda chega, e a etapa gasta tempo do cliente para não gastar
  insumo à toa.
- **Poderia ser realizada como vitrine reposta com produto de
  terceiros (modelo oposto).** O produto já existe antes de alguém
  pedir e a etapa se reduz a separá-lo do estoque exposto. A
  transformação continua acontecendo — o que era item disponível vira
  item comprometido com um pedido —, só que instantânea e antecipada.

## Relações

- `advances` → [[value-stage.transferir-posse-ao-cliente|Transferir posse ao cliente]]
