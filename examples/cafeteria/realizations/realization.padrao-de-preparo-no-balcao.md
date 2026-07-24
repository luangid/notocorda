---
id: realization.padrao-de-preparo-no-balcao
type: realization
status: active
confidence: hypothesis
areas:
  - "[[area.operacoes|Operações]]"
scenarios:
  - "[[scenario.loja-unica|Loja única]]"
  - "[[scenario.loja-inteligente|Loja inteligente]]"
---

# Padrão de preparo no balcão

## Definição

Ficha de preparo afixada atrás da máquina, com a dose de café, a
quantidade de leite e o tempo de extração de cada bebida do cardápio.
Todo barista novo é treinado por acompanhamento nos primeiros turnos até
reproduzir o padrão sem consultar a ficha.

## Papel no negócio

É a forma atual de garantir que a bebida saia igual em qualquer turno,
com qualquer pessoa preparando. Depende da disciplina de seguir a ficha
e do treino inicial — não há medição nem registro de conformidade, então
o desvio só aparece quando o cliente reclama.

## Relações

- `realizes` → [[capability.garantir-consistencia-da-bebida|Garantir consistência da bebida]]
