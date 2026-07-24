# Visualizador (v0)

App web próprio (decisão registrada em `docs/contrato-de-formatos.md` §5),
porte do protótipo "Grafo em Camadas" adaptado ao contrato de formatos.
Consome **somente** o plano derivado (`graph.json`).

**Alinhado ao Guia v0.2 (2026-07-24):** 6 famílias de caixa
(spine+spine_kind, realization, system, data, evidence, problem), nuvens de
área por `areas:` (membership, sem setas), níveis do seletor vindos da
`view` (`scenario_levels`; nível 0 = espinha), aresta herdando cenário do
documento de origem, relações do vocabulário §6.4.

## Rodar

```bash
./notocorda                 # janela própria (desktop) — jeito normal
./notocorda --web 8137      # só serve; abrir http://localhost:8137/viewer/
```

Sem argumento, abre o exemplo da cafeteria — o mesmo padrão do `index.html`
quando servido por HTTP. Para outro mapa, passe o caminho do `graph.json`,
mesmo que ele more fora deste repositório.

**A interface é uma só** para desktop e web (CONTRATO §5.6). Quem sabe onde
está rodando é apenas `bridge.js`: no desktop ele fala com o Python por
`window.pywebview.api` (salvar view em `views/`, abrir o `.md` no editor);
no navegador, cai para download de arquivo. Nenhuma tela muda entre os dois.

## Identidade visual — "prancha de atlas"

A tela é lida como um atlas impresso: o canvas é a **prancha** (a folha do
mapa) e os painéis são a **marginalia** (índice de topônimos à esquerda,
convenções cartográficas à direita). Daí decorrem duas famílias de tokens,
trocadas em bloco por `applyTheme()`:

- **margem** — `--margem`, `--margem-2`, `--margem-3`, `--tinta-margem`,
  `--muted`, `--hairline`. Vale para painéis, cabeçalho e rodapé.
- **prancha** — `--papel`, `--papel-2`, `--tinta`, `--traco`, `--graticule`.
  Vale para o canvas e para tudo que flutua sobre ele (convenções, seletor
  de níveis, notas, editor). Elemento de folha nunca usa cor de margem.

`--sinal` é o **magenta de sinalização das cartas náuticas** — a tinta que
uma carta reserva a avisos, rotas e luzes. Aqui marca foco, seleção e estado
ativo, e **só isso**: não preenche botão de ação, não colore aresta comum.
`--sinal-m` é a variante legível sobre a margem. `--perigo` é o
vermelho-recife dos problemas.

**Três paletas**, todas cartográficas: `carta` (papel creme emoldurado por
margens escuras — padrão), `sonda` (carta batimétrica noturna) e `ozalid`
(cópia heliográfica, tudo claro com tinta azul-ferro). O botão "Paleta"
alterna entre elas.

**Tipografia em três papéis:** Fraunces (display — wordmark, títulos de
painel, nome da célula; itálico para nomes de área, como a hidrografia de
uma carta), IBM Plex Sans (corpo) e IBM Plex Mono **contido** ao que é
técnico de verdade: caminhos, coordenadas, contadores e o carimbo de edição.
As fontes são **locais** (`fonts/` + `fonts.css`) — o app roda no desktop e a
identidade não pode depender de CDN.

**Tinta é o nível em foco**, não a família: quem pertence ao nível aberto é
bloco de tinta cheia; o nível de trás fica apagado e, ao ser tocado pelo foco,
sobe apenas a um cinza claro. (Amarrar o bloco à família "essencial" deixava
os cenários inteiros brancos.) Problema é exceção: caixa clara com traço de
perigo, porque cor de estado tem de saltar.

**Convenções cartográficas** são a peça-assinatura: seis glifos (sólido,
vazado, vazado com montante, losango, tracejado, triângulo), um por camada,
idênticos na legenda da prancha, no índice, no cartão e no filete da borda
das células. Ver CONTRATO §3.1 — cor de família entra pelo filete, nunca no
preenchimento (que continua sendo de estado).

Caixa-alta ficou reservada aos títulos dos dois painéis. Contraste AA nos
textos, foco de teclado visível e `prefers-reduced-motion` respeitado
(inclusive no pulso da célula selecionada, no canvas).

## Layout — como cada célula ganha lugar

- **Espinha**: eixo de valor por `advances` (aceita ciclo) + tiers de
  capacidades/invariantes acima e abaixo, com minimização de cruzamentos.
- **Demais camadas** (realizações, problemas, sistemas, dados, evidências):
  antes ficavam numa faixa por tipo com x pseudo-aleatório e a física
  acomodava — daí o amontoado. Agora cada célula tem lugar por três
  critérios: **área** (uma coluna por área, e as colunas não se sobrepõem),
  **camada** (uma faixa por família, alinhada entre todas as colunas) e
  **âncora** (dentro da faixa, a ordem segue a posição no eixo daquilo que a
  célula sustenta). A largura do bloco é ajustada à largura do eixo, para o
  "enquadrar" não afastar a câmera a ponto de sumir com os rótulos.
- A física só resolve sobreposição residual; ela não decide mais posição.
- As **caixas crescem para baixo**: o nome cabe inteiro (até 5 linhas) e o
  topo permanece onde estaria a caixa de duas linhas, para o eixo e as faixas
  não subirem junto com o texto.
- Os **rótulos das nuvens** são colocados por último, com resolução de
  colisão: quem bateria em outro sobe até achar folga. O nome usa tinta de
  rótulo (mais escura e saturada que a mancha da nuvem) sobre um **halo** na
  cor do papel — o mesmo recurso que uma carta usa para o topônimo continuar
  legível por cima de relevo, água ou malha.

Conferência rápida do layout (roda em Node, sem navegador):

```bash
node -e "const C=require('./viewer/graph-core.js');
const g=C.computeLayout(C.adaptGraph(require('./examples/cafeteria/graph.json')));
console.log('cruzamentos no eixo:', g.cruzamentos, '| colunas:', g.colunas.map(c=>c.area).join(', '))"
```

## Abrir outro mapa

Isto é **ferramenta**, não o leitor de um mapa só: o botão **Abrir mapa**
lista os `graph.json` ao alcance (no desktop o Python varre a pasta servida;
no navegador sondamos os caminhos de convenção) e abre qualquer outro arquivo
do disco — diálogo nativo no desktop, seletor do navegador na web.

Trocar de mapa **recarrega a página** com outro `?graph=`: é o jeito honesto
de zerar câmera, trilha e níveis, que são por mapa. Arquivo fora da pasta
servida não tem URL, então viaja pelo `sessionStorage` e abre com
`?graph=session:` — some ao fechar a aba.

O nome no cabeçalho vem de `?org=` (preenchido com a pasta do grafo ao abrir
pela lista).

## Notas e trilha de leitura

Clicar numa célula abre a **nota** dela sobre a prancha. Clicar numa relação
dentro da nota abre a próxima em cascata: a sequência é a **trilha**, o
caminho de leitura, e ela aparece realçada no mapa (células com borda de
sinal, elos em traço firme). Cada nota:

- é arrastável pelo cabeçalho e rola por dentro (conteúdo integral);
- traz "↳ vindo de …" quando veio de outra;
- mostra sua posição na trilha (`2/3`) e fecha sozinha no `×`;
- `Esc` fecha a trilha inteira.

Atalhos do mapa: **Ctrl** (⌘ no Mac) é o modificador — Ctrl+arrastar na
folha vazia abre a janela de seleção; Ctrl+clique numa célula acrescenta a
nota dela à trilha aberta. Passar o mouse por um verbete do índice acende a
célula correspondente na prancha.

## Parâmetros de URL

| Parâmetro | Efeito | Exemplo |
|---|---|---|
| `graph` | URL do graph.json a carregar | `?graph=../examples/cafeteria/graph.json` |
| `view` | URL de um arquivo de view (posições — contrato §8) | `?view=../examples/cafeteria/views/geral.view.json` |
| `level` | Nível inicial do seletor | `?level=-1` (As-Is) |
| `org` | Nome exibido no cabeçalho | `?org=cafeteria` |
| `paleta` | Paleta inicial (`carta`, `sonda`, `ozalid`) | `?paleta=sonda` |
| `abrir` | Já mostra o seletor de mapas | `?abrir=1` |
| `trilha` | Reabre um caminho de leitura (ids separados por vírgula) | `?trilha=value-stage.produzir-bebida,capability.garantir-consistencia-da-bebida` |

## O que a v0 faz

- Canvas em camadas: eixo de valor no topo (cadeia `advances`), tiers de
  capacidades (Sugiyama por baricentro), faixas de operação/sistemas/dados.
- **Ciclo no eixo**: a cadeia de etapas pode fechar ciclo (a última devolve
  ao planejamento). Cada etapa ocupa uma posição só, e a aresta de retorno
  vira arco por baixo do eixo com o marcador `↺` (CONTRATO §3.8).
- **Eixo ao centro, costelas para os dois lados**: capacidades e invariantes
  descem (sustentação), eventos e obrigações sobem (consequência), e a ordem
  dentro de cada camada é escolhida para **minimizar cruzamento de arestas**
  — mediana dos vizinhos, transposição adjacente e troca de lado, tudo
  determinístico. Num mapa real de 34 nós: **99 → 24 cruzamentos**, zero
  sobreposições. `g.cruzamentos` expõe o placar.
- **Tamanho é hierarquia**: a caixa cresce por família (etapa de valor é o
  esqueleto), encolhe com a distância do eixo e cresce com o número de
  relações — um nó com uma única ligação fica pequeno mesmo colado no eixo.
  O tom acompanha: maior é mais claro.
- **A caixa escala com o zoom** (dimensões em unidades de mundo). Afastar
  encolhe tudo junto; abaixo de ~5px o rótulo some e volta ao aproximar.
  Antes a fonte tinha piso em pixels de tela, então a caixa inchava ao
  afastar e as vizinhas se sobrepunham.
- **Mapa estático**: a acomodação roda de uma vez em `assentar()`, fora da
  tela, e congela. Nada fica tremendo enquanto se lê.
- **Cartão de detalhe independente**: clicar numa célula abre um cartão
  sobre a prancha, com definição e relações, sem depender de nenhum painel
  lateral estar aberto.
- **Seleção por janela**: ferramenta "Selecionar" (ou Shift+arrastar) marca
  várias células; arrastar uma marcada move o grupo. Esc limpa.
- **Espaçamento ajustável** no painel: recalcula o layout inteiro.
- **Duas visualizações**: "Prancha" (caixas com texto dentro, padrão) e
  "Grafo" (bolhas com rótulo fora).
- Seletor de níveis: espinha = nível 0 fixo; cenários As-Is (negativos) e
  To-Be (positivos) vindos do `graph.json`; teclas ↑/↓.
- Física suave com separação de células, nuvens de área (por
  `owners.business`), foco/vizinhança com profundidade 1–3, caminho até a
  espinha, sentença legível ao clicar numa aresta.
- Dores (`pain`) em vermelho com relação `hinders` tracejada; badge `+N` de
  vizinhos recolhidos com revelação progressiva.
- Comparação To-Be × cenário-base (`baseline`): adicionado/alterado/removido
  via relações `replaces`.
- Inspetor com status, confiança, responsável, cenários e arquivo-fonte;
  pré-visualização Markdown do nó ("Abrir documento").
- "Salvar view" baixa um arquivo de view (posições por ID — contrato §8);
  recarregue com `?view=`.
- 3 paletas cartográficas (carta/sonda/ozalid), minimapa em moldura de mapa
  de situação, busca no índice.

## O que fica para as próximas iterações

- Edição gráfica gravando nos arquivos de autoria (hoje: leitura + views).
- Diff visual completo entre cenários (hoje: cores de comparação).
- Deep-link `obsidian://open` no arquivo-fonte.
- Exibição dos `diagnostics.gaps` sobre os nós (hoje: contagem no rodapé).
- Deploy (Fly.io, como o MCP do projeto de dados) quando houver conteúdo real.

## Arquivos

- `graph-core.js` — adaptador do contrato + layout + geometria (puro; roda em
  Node para testes: `node -e "require('./graph-core.js')"`).
- `app.js` — engine canvas + UI (paletas, convenções, notas).
- `bridge.js` — única peça que distingue desktop de web.
- `index.html` — shell + folha de estilo (tokens de margem e de prancha).
- `fonts.css` + `fonts/` — Fraunces, IBM Plex Sans e IBM Plex Mono locais.

## Testar

```bash
node --check app.js graph-core.js bridge.js
python3 ../compiler/validate.py ../examples/cafeteria/graph.json
.venv/bin/python ../desktop/captura.py examples/cafeteria/graph.json /tmp/mapa.png
```

Para o teste visual use `captura.py`, não navegador headless: em grafos
maiores o headless congela o laço de animação e devolve canvas em branco —
parece bug do viewer sem ser.

Critério de aceitação: trocar o fixture pelo mapa real de uma organização
**não deve exigir mudança de código** — apenas outro `?graph=`.
