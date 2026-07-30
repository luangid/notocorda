---
id: invariant.insumo-vencido-nao-utilizado
type: spine
spine_kind: invariant
status: active
confidence: hypothesis
---

# Insumo vencido não é utilizado

## Definição

O que deve permanecer verdadeiro: nenhum insumo fora da validade entra
na produção de uma bebida.

É condição, não tarefa: não obriga a conferir a prateleira todo turno
nem a etiquetar nada — obriga apenas que o insumo vencido não chegue à
bebida. Como impedir isso é escolha da realização, e uma realização que
descarta cedo demais cumpre o invariante desperdiçando.

## Papel no negócio

Protege a segurança alimentar e a confiança do cliente, independente do
método de controle de estoque adotado.

## Exemplos de realizações contrastantes

Hipóteses ilustrativas para mostrar a invariância — o As-Is real do
exemplo está nas realizações ligadas a esta caixa.

- **Poderia ser realizado como etiqueta de data de abertura por
  item.** Cada embalagem aberta ganha a data e o prazo de uso, e a
  conferência é item a item. Precisa de disciplina de etiquetagem e
  aproveita o insumo até o último dia útil dele.
- **Poderia ser realizado como descarte por lote programado (modelo
  oposto).** Tudo o que foi aberto num turno é descartado ao fim de um
  prazo fixo, sem olhar a data individual de cada item. A condição é
  cumprida sem que ninguém precise saber a validade de coisa alguma —
  paga-se em insumo jogado fora o que se economiza em atenção.

## Relações

- `constrains` → [[capability.garantir-consistencia-da-bebida|Garantir consistência da bebida]]

## Problemas ou questões abertas

O invariante restringe *Garantir consistência da bebida*, mas o que ele
protege é segurança alimentar, não uniformidade — a validade também
alcança insumo que nunca vira bebida. Falta decidir se o alvo do
`constrains` deveria ser *Garantir insumos*, que responde pela custódia
do insumo, ou se ele restringe as duas capacidades. Questão de
modelagem, resolvida em decisão separada.
