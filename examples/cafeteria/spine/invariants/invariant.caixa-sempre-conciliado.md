---
id: invariant.caixa-sempre-conciliado
type: spine
spine_kind: invariant
status: active
confidence: hypothesis
---

# Caixa sempre conciliado

## Definição

O que deve permanecer verdadeiro: sempre que o caixa é apurado, o que
entrou e o que saiu conferem com o que foi registrado, sem diferença
sem explicação.

É condição, não tarefa: o invariante não manda conferir todo dia nem
diz com que frequência apurar — só proíbe o estado em que a diferença
existe e ninguém sabe de onde veio. Quando apurar é escolha da
realização.

## Papel no negócio

Protege a integridade financeira da loja, independentemente de quantos
meios de pagamento existam ou de quem feche o caixa. Vale pelos dois
lados: tanto o que se cobra do cliente quanto o que se paga a
fornecedores precisam estar reconhecidos quando o caixa é apurado.

## Exemplos de realizações contrastantes

Hipóteses ilustrativas para mostrar a invariância — o As-Is real do
exemplo está nas realizações ligadas a esta caixa.

- **Poderia ser realizado como contagem cega da gaveta.** Quem fecha
  conta o dinheiro sem saber o total esperado, e a diferença aparece na
  comparação feita por outra pessoa. O invariante é verificado uma vez
  por dia, e o erro só se descobre no fim.
- **Poderia ser realizado como conciliação automática contínua (modelo
  oposto).** Cada transação é casada com o extrato de quem liquida
  assim que ela liquida, e não existe momento de fechamento. O
  invariante é o mesmo; passa a ser verificado o tempo todo em vez de
  uma vez por dia — e é isso que mostra que "fechamento" nunca fez
  parte da condição, só do método.

## Relações

- `constrains` → [[capability.processar-pagamentos|Processar pagamentos]]
- `constrains` → [[capability.honrar-compromissos-financeiros|Honrar compromissos financeiros]]

## Problemas ou questões abertas

A realização atual lança a diferença numa célula de "ajuste"
(*Conferência de caixa no fechamento*). Falta decidir se isso satisfaz
o invariante ou o viola com registro: se a diferença lançada não vem
acompanhada da explicação, o caixa fecha na aritmética e não fecha na
condição. A resposta muda o que é um fechamento aprovado.
