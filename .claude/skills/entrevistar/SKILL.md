---
name: entrevistar
description: Ciclo de entrevistas para mapear o As-Is de uma organização num mapa Notocorda — preparar o roteiro mirado nas lacunas, processar a transcrição em evidência e caixas candidatas, e devolver ao entrevistado o recorte do mapa que a fala dele gerou. Use ao preparar uma entrevista de mapeamento, processar uma transcrição, ou montar a devolução.
---

# Entrevistar

A entrevista é a fonte primária do As-Is: entra como conversa leve sobre o
trabalho da pessoa, sai como documentação. Três modos: `preparar` →
`processar` → `devolver`.

## Doutrina (vale nos três modos)

- **Sem cheiro de vigilância**: o mapa documenta PROCESSO, nunca desempenho.
  Nome próprio não vira caixa (papel/área sim). Gravar só com consentimento
  explícito e uma frase honesta ("o que você falar vira o mapa, não
  avaliação de ninguém"); pediu pausa, pausa na hora.
- **Áudio é dado pessoal**: transcrever localmente; não subir áudio de
  funcionário para nuvem de terceiros.
- **Devolver em dias, não semanas** — a devolução constrói a confiança que
  torna a próxima entrevista mais fácil.

## `preparar <área/pessoa>`

1. O que o mapa já acusa: `./notocorda resumo <vault>` + skill `lacunas`
   restrita ao território da pessoa.
2. Roteiro de bolso (1 página, checkbox por pergunta):
   - As 4 perguntas de fronteira: **o que você recebe, de quem? / entrega,
     para quem?**; **e quando dá errado?** (a exceção esconde o
     processo-sombra); **e quando você está de férias?**; **que
     planilha/grupo/anotação você mantém por fora do sistema?**
   - Sondas específicas das lacunas ("ninguém quita a obrigação X — quem
     faz?").
   - Fechamento: a **pergunta de ouro** — *"o que nesse processo te rouba
     tempo e não deveria?"* — que alimenta o backlog de dores.
3. Ajustar ênfase ao papel (direção: fins e fronteiras; gestão: fluxo e
   exceções; execução: o passo a passo real). Roteiro é bússola, não trilho.

## `processar <transcrição>`

1. A entrevista vira `evidence.entrevista-<papel>-<aaaa-mm>` (data, papel,
   fatos RELATADOS, caminho do transcript; `confidence: certified` — é fato
   que foi dito; o conteúdo continua relato).
2. Extrair caixas candidatas (`draft` + `hypothesis`, via skill `escrever`):
   realizações, sistemas informais, dados, problemas. Direção das arestas:
   a caixa candidata declara `derived-from` → a evidência; a evidência
   declara `evidences` → as caixas que sustenta. Nunca as duas no mesmo par.
3. As respostas da pergunta de ouro viram caixas `problem` → backlog de
   dores da área.
4. Triangular fronteiras: "recebo de / entrego para" cruzado com o grafo —
   entrega sem contraparte é lacuna candidata e pauta da PRÓXIMA entrevista.
5. Divergência entre entrevistados ou com documentos: registrar em
   "Problemas ou questões abertas", não harmonizar.
6. Fechar: `./notocorda check <vault>` + skill `revisar`.

## `devolver <pessoa/área>`

Devolução **dupla**: (1) o **mapa** — `./notocorda focus <vault>
<caixa-nova>` traduzido para linguagem de operação ("você me contou X, virou
isto — confere?"; a correção é nova evidência; a validação do entrevistado
registra `confidence: validated`, promoção de `status` é da governança); e
(2) **algo útil** — a primeira dor do backlog resolvida de forma que a
pessoa use sozinha em minutos. Documentação é subproduto de resolver
problemas, nunca o pedido principal. Registrar a devolução (data, o que foi
entregue) na evidência da entrevista.
