---
id: roteiro-demo-cafeteria
title: "Roteiro de demonstração — cafeteria"
type: demo-script
status: draft
created_at: 2026-07-24
---

# Roteiro de demonstração para diretores — 10 minutos

> Abrir antes: `http://localhost:8137/viewer/?graph=../examples/cafeteria/graph.json`
> (rodar `./notocorda --web` na raiz do repositório, ou `./notocorda` para a
> janela nativa).
>
> Este roteiro usa uma cafeteria fictícia — não é dado real de empresa
> nenhuma. É o exemplo didático que prova o formato antes de aplicá-lo a um
> fluxo real. Diga isso logo no início, sem rodeios.

Tom da conversa: sem jargão de arquitetura. Não diga "espinha dorsal",
"cenário" ou "nó" a não ser que apareça escrito no próprio mapa — nesse
caso, leia o rótulo em português como está na tela.

---

## 1. Nível 0 — "O que precisa ser verdade em qualquer cafeteria" (2 min)

Abrir no nível **0** (espinha).

Mostrar o eixo no topo: Abastecer operação → Preparar loja → Coletar
pedido → Disponibilizar produto → Transferir posse ao cliente →
Receber pagamento → Fidelizar cliente → (volta para) Servir café com
qualidade e margem.

Falar algo como:

> "Isso aqui é o que qualquer cafeteria — essa ou dez outras — precisa
> conseguir fazer para existir. Não importa se é uma loja ou cem, se é
> caderno ou aplicativo. Essas capacidades e essas regras" — apontar
> para os losangos, ex. *Caixa sempre conciliado* — "não mudam."

Clicar em uma capacidade (ex. *Gerenciar pedidos*) e mostrar que ela
ainda não tem "como" — só o "o quê".

## 2. Descer ao As-Is — "Como essa loja faz hoje" (3 min)

Selecionar o nível **−1** (Loja única).

> "Agora aparece o como. Essa é uma loja real — bom, fictícia, mas
> desenhada como se fosse — mostrando exatamente como ela resolve cada
> uma dessas necessidades hoje."

Apontar realizações concretas e nomeá-las em voz alta: *Pedido no
balcão*, *Compra semanal de insumos*, *Escala manual da equipe*,
*Conferência de caixa no fechamento*, *Controle de validade na
prateleira*. Deixar claro que cada uma dessas caixas é um documento —
clicar em uma para mostrar que abre texto, não só um desenho.

## 3. Problema → evidência → capacidade (3 min)

Clicar no problema **Fila no horário de pico** (vermelho).

Navegar pelas relações visíveis no inspetor:

1. `affects` → **Coletar pedido** (a etapa que esse problema atrapalha);
2. a evidência que sustenta — **Entrevista com barista (jun/2026)** —
   abrir e ler a frase entre aspas do barista;
3. voltar e mostrar `motivates` → **Loja inteligente** (o único To-Be
   desenhado até agora — o topo da escada, não o próximo degrau — que
   essa fila ajuda a justificar).

Repetir rapidamente com **Caixa que não fecha** → evidência da
planilha de fechamento → capacidade **Caixa sempre conciliado**.

Se sobrar tempo, mostrar a lacuna que o próprio nível revela: ainda no
nível **−1** (As-Is), clicar em **Conhecer o cliente** e apontar que não
há nenhuma realização ligada a ela — a loja de hoje não faz nada para
saber quem compra nem para fazer voltar.

> "Isso aqui não é um bug do mapa — é uma lacuna real. Hoje essa loja
> não sabe quem é o cliente que volta; ela só passaria a fazer isso lá
> no topo, com o programa de fidelidade. O mapa mostra o buraco em vez
> de esconder — e mostra que ele só se fecha quando a loja sobe de
> degrau."

Isso já emenda no próximo passo: ao subir para o **+1**, esse mesmo buraco
aparece preenchido.

## 4. Comparar com o topo da escada (2 min)

Subir para o nível **+1** (Loja inteligente).

Explicar antes de navegar:

> "Isso aqui não é 'o próximo passo' — é o topo. É onde a gente quer
> chegar, com pedido pelo app, fidelidade e reposição de insumos
> inteligente juntos. Os degraus entre a loja de hoje e esse topo a
> gente ainda não desenhou — de propósito."

Mostrar **Pedido pelo app** substituindo (`replaces`) **Pedido no
balcão**, e o problema da fila deixando de motivar uma mudança futura
para virar, de fato, algo endereçado.

Deixar claro que o topo **não é só as três novidades**: a maior parte da
loja continua igual — preparo no balcão, entrega por chamada, conciliação
de caixa, pagamento ao fornecedor. Só muda o que precisa mudar; o resto é
a mesma operação. Se o botão de comparação estiver ligado, é isso que as
cores mostram: o que entrou de novo, o que saiu e o que ficou igual.

Fechar com uma frase de charneira:

> "A mesma espinha, a mesma necessidade — só muda o como. E dá para
> comparar as duas fotos, hoje e o topo, no mesmo mapa."

---

## Perguntas para fazer aos diretores ao final

1. Que problema da casa vocês gostariam de ver mapeado assim —
   com o caminho completo até a evidência que prova que ele existe?
2. Olhando para as lacunas que o mapa mostrou aqui (capacidade sem
   realização, problema sem cenário que o resolva) — vocês sabem citar
   uma lacuna parecida que hoje ninguém documentou aqui dentro?
3. Se esse mapa existisse para um fluxo real da empresa, quem
   deveria ser a primeira pessoa a validar se o "como hoje" está
   certo?
