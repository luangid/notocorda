---
id: problem.fila-no-horario-de-pico
type: problem
status: active
confidence: certified
areas:
  - "[[area.operacoes|Operações]]"
scenarios:
  - "[[scenario.loja-unica|Loja única]]"
---

# Fila no horário de pico

## Definição

Entre 7h30 e 9h, a fila para pedir no balcão chega a ultrapassar dez
pessoas, porque cada pedido depende do barista anotar, repetir e só
então iniciar a produção.

## Relações

- `affects` → [[value-stage.coletar-pedido|Coletar pedido]]
- `motivates` → [[scenario.loja-inteligente|Loja inteligente]]

## Evidências

- `evidences` → declarada no lado da evidência
  ([[evidence.entrevista-barista-2026-06|Entrevista com barista]]).

## Problemas ou questões abertas

Sintoma observado é a fila; causa provável é o pedido depender
inteiramente do balcão como único canal — ainda não testada uma
alternativa.
