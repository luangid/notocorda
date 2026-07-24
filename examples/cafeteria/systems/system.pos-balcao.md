---
id: system.pos-balcao
type: system
status: active
confidence: hypothesis
aliases:
  - Maquininha
areas:
  - "[[area.transformacao-digital|Transformação Digital]]"
scenarios:
  - "[[scenario.loja-unica|Loja única]]"
---

# POS do balcão

## Definição

Ponto de venda instalado no balcão — a "maquininha" que a equipe usa
para cobrar o cliente. Não tem integração com estoque, planilha de
vendas ou qualquer outro sistema: cada cobrança fica isolada no
extrato do próprio equipamento.

## Papel no negócio

Apoia o registro do pedido e o pagamento na loja física. É reconhecido
por qualquer pessoa da operação — não exige explicação.

## Relações

- `supports` → [[realization.pedido-no-balcao|Pedido no balcão]]
- `supports` → [[realization.pagamento-na-maquininha|Pagamento na maquininha]]

## Problemas ou questões abertas

Ausência de integração é a limitação mais citada nas entrevistas: força
a reconciliação manual em planilha à parte.
