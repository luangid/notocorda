---
id: value-stage.preparar-loja
type: spine
spine_kind: value-stage
status: active
confidence: hypothesis
---

# Preparar loja

## Definição

Transformação necessária: o posto de operação passa de parado a apto a
atender — instalação em condição de higiene e funcionamento, insumos ao
alcance da mão e gente escalada e presente. Termina antes do primeiro
cliente; ter as pessoas certas e treinadas para escalar é da capacidade
que habilita esta etapa, não dela.

Acontece por turno, não por dia: numa operação de dois turnos, a etapa
acontece duas vezes.

## Papel no negócio

Garante que a operação comece em condição de atender, e não que o
atendimento comece enquanto a loja ainda está sendo organizada.

## Exemplos de realizações contrastantes

Hipóteses ilustrativas para mostrar a invariância — o As-Is real do
exemplo está nas realizações ligadas a esta caixa.

- **Poderia ser realizada como preparo cruzado entre turnos.** Quem sai
  deixa tudo pronto para quem entra e não existe momento de abertura: a
  etapa acontece no fechamento anterior. A transformação continua
  ocorrendo uma vez por turno, só que antecipada.
- **Poderia ser realizada como abertura auditada por sistema (modelo
  oposto).** Registro de ponto, sensor de temperatura da câmara e
  checklist em aplicativo travam a liberação do caixa enquanto algum
  item não estiver conferido. A etapa é a mesma; muda quem atesta que
  ela terminou — o sistema em vez de quem assina.

## Relações

- `advances` → [[value-stage.coletar-pedido|Coletar pedido]]
