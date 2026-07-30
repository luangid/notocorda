---
id: capability.processar-pagamentos
type: spine
spine_kind: capability
status: active
confidence: hypothesis
---

# Processar pagamentos

## Definição

Capacidade de cobrar do cliente o valor correto pelo que foi vendido e
reconhecer esse recebimento no caixa. É o lado de contas a receber do
financeiro — pagar fornecedores é a capacidade separada de honrar
compromissos financeiros. Não fixa o momento da cobrança: à vista, na
saída ou em fatura depois, é escolha da realização.

É cobrada em toda venda e falha de duas maneiras opostas — cobrar a
menos come a margem, cobrar a mais devolve o cliente para o
concorrente.

## Papel no negócio

Sustenta a etapa de receber pagamento e é a capacidade sobre a qual o
invariante de caixa conciliado se apoia pelo lado da entrada de dinheiro.

## Exemplos de realizações contrastantes

Hipóteses ilustrativas para mostrar a invariância — o As-Is real do
exemplo está nas realizações ligadas a esta caixa.

- **Poderia ser realizada como preço de tabela cobrado de cabeça.**
  Cardápio curto de preços redondos, conta somada de memória e recibo
  só quando o cliente pede. O valor correto depende inteiramente de
  quem atende saber a tabela, e o reconhecimento, de alguém anotar
  depois.
- **Poderia ser realizada como conta vinculada ao cliente identificado
  na entrada (modelo oposto).** O valor é calculado a partir do que foi
  retirado e debitado sem que exista um ato de pagar. Não há momento de
  cobrança para errar; o erro migra para o cadastro de preços e para a
  identificação de quem entrou.

## Relações

- `enables` → [[value-stage.receber-pagamento|Receber pagamento]]
