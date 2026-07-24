---
id: value-stage.disponibilizar-produto
type: spine
spine_kind: value-stage
status: active
confidence: hypothesis
areas:
  - "[[area.operacoes|Operações]]"
---

# Disponibilizar produto

## Definição

Transformação necessária: o produto do pedido fica pronto para ser
passado ao cliente — seja produzido na hora, montado a partir de
insumos, ou obtido já pronto, por exemplo comprado de terceiros para
revenda.

## Papel no negócio

É onde o pedido vira produto, qualquer que seja o método escolhido. A
espinha não presume que a loja precise fabricar o que vende para
cumprir esta etapa.

## Relações

- `advances` → [[value-stage.transferir-posse-ao-cliente|Transferir posse ao cliente]]
