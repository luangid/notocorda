---
id: capability.honrar-compromissos-financeiros
type: spine
spine_kind: capability
status: active
confidence: hypothesis
---

# Honrar compromissos financeiros

## Definição

Capacidade de liquidar as obrigações financeiras da loja — pagar
fornecedores e demais contas devidas — no valor e no prazo acordados.

## Papel no negócio

É o lado de contas a pagar do financeiro, distinto de cobrar o cliente:
quando um evento econômico cria uma obrigação (aceitar uma entrega cria
o dever de pagar o fornecedor), é esta capacidade que a leva à
liquidação. Separá-la de *Processar pagamentos* deixa explícito que
dinheiro que sai e dinheiro que entra são fluxos diferentes, ainda que
ambos passem pelo mesmo caixa.

## Papel na espinha

Não habilita uma etapa de valor neste exemplo: o fluxo de valor da
cafeteria termina em fidelizar o cliente e não tem uma etapa dedicada a
"fechar as contas". A capacidade é puxada pela obrigação que a requer
(*Pagar fornecedor*) e materializada pela realização que a cumpre. Numa
operação maior, a capacidade equivalente costuma habilitar uma etapa
dedicada a medir, faturar e receber; aqui ela apenas quita a obrigação
que o evento cria.

## Problemas ou questões abertas

O invariante *Caixa sempre conciliado* restringe esta capacidade (ver o
próprio invariante): tanto o que sai quanto o que entra precisam bater
no fechamento. Se a governança criar uma etapa de valor financeira,
reavaliar se esta capacidade passa a habilitá-la.
