---
id: contrato-de-formatos-atlas
type: specification
status: proposed
version: 0.2
created_at: 2026-07-24
reviewed_at: 2026-07-24
relates_to:
  - guia-implementacao-grafo-camadas-atlas
---

# Contrato de formatos do Atlas (v0.2)

> **O manual dos documentos do Atlas é o próprio Guia de Implementação
> (v0.2)** — tipos (§4), contrato de documento (§5), wikilinks e relações
> (§6), áreas (§7), cenários e níveis (§8), validação (§14), views (§15).
> Este arquivo NÃO duplica o manual: ele registra apenas o que o Guia
> delega à implementação — os schemas executáveis, a forma exata do
> `graph.json` e as regras de renderização do visualizador.
>
> v0.2 substitui integralmente a v0.1 (que usava 24 tipos e relações no
> frontmatter — modelo abandonado pelo Guia v0.2).

## 1. Schemas executáveis

| Arquivo | Valida | Fonte no Guia |
|---|---|---|
| `schemas/document.schema.json` | Frontmatter de qualquer documento de autoria | §4, §5, §8.1, §15 |
| `schemas/registries.yaml` | Vocabulários fechados: 6 caixas, 6 `spine_kind`, 3 contextuais, relações, status | §4, §5.4, §6.4 |
| `schemas/graph.schema.json` | O `graph.json` derivado que o viewer consome | §13 |

Regras que o schema não captura e o compilador deve verificar (Guia §14):
nome do arquivo = ID; wikilinks resolvidos; relações extraídas do corpo
(seção `## Relações`, formato `- \`tipo\` → [[id|Título]]`); combinações
origem→relação→destino; `related-to` sempre aviso.

## 2. `graph.json` — decisões de projeção (o que o Guia deixa aberto)

O Guia §13.2 lista as saídas do compilador (`nodes.json`, `edges.json`,
`memberships.json`...). Para o **viewer**, o `graph.json` é o agregado
autossuficiente, com estas decisões:

1. **Caixas** (`nodes[]`): só os 6 tipos de caixa. `spine` carrega
   `spine_kind`. `name` vem do H1; `definition` da seção `## Definição`.
2. **Membership de área** vai inline no nó (`areas: [ids]`), como no
   exemplo do Guia §13.3 — nunca vira aresta.
3. **Arestas** (`edges[]`): `{source, type, target}`, extraídas dos
   wikilinks tipados. **Cenário de aresta não existe**: herda do documento
   de origem (Guia §6.6). Arestas cujo destino é documento contextual
   (ex.: `motivates` → cenário) permanecem no grafo, mas não são
   desenhadas como caixa-a-caixa; aparecem no inspetor.
4. **`scenarios[]` e `areas[]`** são coleções próprias (projeção dos
   documentos contextuais), com `baseline` no cenário.
5. **`views[]`** projetadas no `graph.json`: `scenario_levels` (o nível 0
   é `scenario: null` = espinha), `visible_types`, `show_area_clouds`,
   `layout` (posições por ID — Guia §15).
6. **`diagnostics`** com `errors`, `warnings` e `gaps` (Guia §14).
7. **`graph.yaml` — a projeção legível para IA** (decidido em 2026-07-24). Mesmo conteúdo do `graph.json`, reorganizado para leitura:
   caixas agrupadas por família, relações como frases
   `tipo → id (Nome legível)`, backlinks derivados em `recebe:`, cenários/
   áreas/lacunas em seções próprias. Divisão de público: **pessoas usam o
   Mapa Vivo; agentes leem o `graph.yaml`** — mesmo um fluxo grande
   continua sendo YAML legível, e o agente entende o grafo sem parsear
   wikilinks nem carregar a vault. É projeção derivada (nunca editada à
   mão) e **somente leitura**: a escrita da IA continua sendo proposta de
   patch nos Markdown de autoria (Guia §3.9). Gerador de referência:
   `compiler/graph_to_yaml.py`.
   **A projeção sai junto do `graph.json` (2026-07-24)**: `build_graph.py`
   grava os dois no mesmo passo. Gerada à parte, ela envelhecia sem ninguém
   notar — e agente lendo YAML velho é pior que agente sem YAML. Erros de
   validação passaram a ser projetados (`erros:` + `atlas.integridade`): antes
   o agente lia um grafo que se dizia íntegro sem ser.
   Fidelidade verificável por `compiler/auditar_yaml.py --todos`, que checa
   conservação nos dois sentidos (nada se perde, nada é inventado) e se o
   arquivo em disco está atualizado.

## 3. Regras de renderização do viewer (Mapa Vivo)

1. Legenda = as 6 famílias do Guia §4.1. `problem` é cor de estado
   (vermelho); as demais famílias se distinguem por forma/preenchimento,
   não por cor por tipo.
   **Convenções cartográficas (2026-07-24):** cada família tem um glifo
   próprio (sólido, vazado, vazado com montante, losango, tracejado,
   triângulo) e uma cor de convenção, repetidos sem variação na legenda da
   prancha, no índice, no cartão e num **filete na borda da célula**. Isso
   não é "cor por tipo": o preenchimento e a borda de estado continuam
   reservados a status/problema/foco — a cor de família só entra pelo
   filete e pelos glifos de legenda.
2. Espinha: `value-stage` encadeadas por `advances` formam o eixo no topo
   (objetivo acima do eixo); capacidades/invariantes descem por tiers
   (`enables`/`requires`/`constrains`). Espinha sempre visível; nos níveis
   de cenário fica esmaecida ao fundo (presença ajustável).
   **Tinta = nível em foco (2026-07-24):** o preenchimento cheio marca o que
   pertence ao nível aberto — no nível 0 é a espinha; num cenário são as
   realizações, sistemas, dados e evidências dele. O nível de trás fica
   apagado, e quando o foco o alcança sobe só até um cinza claro: nunca
   assume a presença de quem está no nível aberto.
3. Seletor de níveis = `scenario_levels` da view ativa (fallback: cenário
   `current` → −1, espinha → 0, demais → +1…). Nível é **da view**, não do
   cenário (Guia §8.3).
4. Visibilidade: documento sem `scenarios` vale em todos; com `scenarios`,
   só quando um deles está ativo. Aresta herda da origem.
5. Áreas viram nuvens (convex hull) com contador derivado; sem setas para
   a área (Guia §7.2, §7.5). Documento pode estar em várias nuvens.
6. Comparação To-Be × `baseline`: adicionado / alterado (`replaces` na
   origem) / removido (alvo de `replaces`), como cores temporárias.
7. Posições manuais: somente em views; "Salvar view" exporta
   `{id, type: view, layout: {id: {x, y}}}`. Nunca gravar posição em
   documento de negócio.
8. **Ciclo no eixo de valor** (2026-07-24): a cadeia de `advances` entre
   etapas pode fechar ciclo — o ciclo macro do contrato devolve a última
   etapa ao planejamento (ZERO §4, `V8 → V3`). Cada etapa ocupa UMA posição
   no eixo; a aresta que volta para uma etapa anterior é desenhada como
   arco por baixo do eixo, marcada com `↺`, nunca como reta atravessando as
   etapas intermediárias. O marcador é notação do viewer, não conteúdo do
   modelo.

## 4. Fixture de desenvolvimento

`examples/cafeteria/` — a cafeteria do Guia §10, completa no formato v0.2:
- `graph.json` válido contra `schemas/graph.schema.json` (o que o
  compilador deverá produzir a partir dos Markdown);
- exemplos de autoria: capacidade, realização, problema, área, cenário e
  view — espelhando os exemplos literais do Guia.

Critério do Marco 2 (Guia §20): *"a cafeteria imaginária pode ser
reconstruída integralmente a partir dos Markdown"* — o compilador
(Marco 1) deve gerar este `graph.json` a partir de `examples/cafeteria/`.

## 5. Decisões a ratificar em ADR (Sessão 1)

1. O Guia v0.2 é o manual canônico; este contrato é subordinado a ele.
2. `graph.json` agregado como interface única do viewer (§2 acima).
3. Nível 0 = `scenario: null` na view (o Guia exemplifica um cenário
   `espinha-dorsal` dedicado — escolher UMA das duas formas e fixar).
4. **Mapa Vivo é app web próprio, não plugin do Obsidian** (2026-07-24):
   a diretoria acessa por link; canvas 100% custom; dependência essencial
   de plugin de terceiro está vedada; Obsidian é ferramenta de autoria,
   não portal. Obsidian segue como editor opcional dos arquivos;
   deep-link `obsidian://open` é evolução simples. Wrapper plugin fica
   como possibilidade futura sem custo de adiamento.
5. Campo `confidence` (hypothesis/certified/validated) — o Guia o cita
   como opcional; manter.
6. **Desktop primeiro, web depois, interface única** (decidido em
   2026-07-24). O mapa nasce como aplicativo de desktop — um "Obsidian
   próprio" para os primeiros acompanhamentos — e depois ganha versão web
   com login e leitura do git. Como as duas terão
   praticamente a mesma tela, a interface **não pode existir em duas
   versões**: `viewer/` (HTML + canvas) é a única, e roda dentro de uma
   janela nativa hoje e num servidor amanhã. Consequências fixadas:
   - **Python é o backend nos dois casos** — compilador, validação,
     projeções e serviços de arquivo (`compiler/`, `desktop/`). O canvas
     segue em JS porque o laço de desenho a 60 fps é o único ponto onde a
     linguagem pesa; Pyodide foi descartado por custo de partida e de
     quadro.
   - **`viewer/bridge.js` é a única peça que sabe onde está rodando**
     (`window.pywebview.api` no desktop, HTTP na web). Nenhuma tela muda
     na migração; só esse arquivo ganha o caminho HTTP.
   - Desktop nativo (Qt/PySide) foi descartado: exigiria desenhar a mesma
     interface duas vezes, que divergiriam.
