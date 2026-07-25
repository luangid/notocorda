---
name: lacunas
description: Auditar o As-Is de um mapa Notocorda em busca de lacunas — processos que existem no mundo mas não estão no mapa — usando 7 detectores de conservação (capacidade sem cobertura, obrigação sem quitação, dado/sistema órfão, aresta unilateral, problema sem mitigação, evidência solta, medição dupla-via). Use ao revisar cobertura do As-Is ou quando alguém perguntar "o que está faltando no mapa?".
---

# Lacunas

Princípio: **lacuna não se encontra olhando para o mapa; encontra-se cruzando
o mapa contra coisas que precisam "fechar a conta"**. Todo fluxo real
(dinheiro, material, informação) é conservado — se algo se move no mundo e
nenhuma caixa explica, há um processo invisível. A meta não é completude, é
**detectabilidade**.

Insumo: o `graph.yaml` do vault (projeção para IA) e as lentes CLI
(`./notocorda check|view|focus|impacto|resumo`) — a lente calcula, a skill
julga. Vocabulário: `schemas/registries.yaml`.

## Os 7 detectores

1. **Capacidade/etapa sem cobertura** — `spine` sem `realizes` recebido no
   cenário em análise (etapa conta como coberta se a capacidade que a
   `enables` estiver realizada). Ou ninguém faz (grave), ou alguém faz sem
   estar mapeado (lacuna).
2. **Obrigação sem quitação** — `event` que `creates` uma `obligation` sem
   processo que a quite = processo invisível (ou obrigação descumprida).
3. **Dado/sistema órfão** — `system` sem `supports` de saída; `data` sem
   `records`/`measures` de saída e sem `uses` recebido; item de inventário
   de sistemas sem caixa. O sedimento (dado) denuncia a atividade.
4. **Aresta unilateral** — handoff declarado só por um lado ("entrego X
   para B" sem contraparte em B). Fronteiras entre áreas escondem processos.
5. **Problema sem mitigação** — `problem` sem `mitigates` recebido: ninguém
   trata, ou alguém apaga o incêndio informalmente.
6. **Evidência solta** — `evidence` sem `evidences`/`contradicts` de saída
   e sem `derived-from` recebido: artefato órfão denuncia atividade órfã.
7. **Medição (dupla via)** — (a) ponto cego: objetivo/etapa/capacidade
   central sem `measures` recebido; (b) KPI órfão: `data` de indicador que
   não mede nada essencial (por que existe? quem olha?).

Considerar as `lacunas`/`avisos` já emitidos pelo compilador — referenciar,
não duplicar.

## Saída

Relatório em Markdown, por detector: caixa afetada, evidência do que não
fecha, e **próxima sonda** concreta (quem perguntar, que sistema olhar).
Classificar cada achado como hipótese (`processo-invisivel?` /
`problema-real?` / `mapa-incompleto?`) — quem decide é a fonte. Nunca
"corrigir" o mapa inventando conteúdo.
