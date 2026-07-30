# Onde isto se encaixa: OKR, BSC e o padrão LLM Wiki

Duas perguntas aparecem quando se apresenta o grafo em camadas: "isso
substitui OKR ou BSC?" e "isso é um wiki mantido por IA?". A resposta
curta: não substitui — empilha; e é quase um LLM wiki — com uma
divergência deliberada. Este documento desenvolve as duas respostas.

## OKR e BSC são protocolos de direção; o grafo é substrato

OKR e BSC não são formatos de documentação — são protocolos de
direção. OKR responde "o que priorizamos neste ciclo e como medimos
progresso"; o Balanced Scorecard responde "a estratégia está
equilibrada entre as quatro perspectivas, e quais setas causais ligam
uma coisa à outra". O grafo em camadas responde uma pergunta anterior:
**como a organização funciona, de fato, e o que quebra se algo parar**.
Não competem no mesmo eixo.

| | OKR | BSC | Grafo em camadas |
|---|---|---|---|
| Pergunta que responde | O que priorizar agora? | A estratégia está equilibrada? | Como a organização funciona? |
| Forma | 3–5 objetivos + key results | 4 perspectivas + mapa estratégico | Grafo tipado (espinha + camadas) |
| Cadência | Trimestral; expira por design | Anual, quando revisado | Contínua |
| Legível por máquina | Não | Não | Sim (`graph.yaml`, lentes CLI) |
| Causalidade | Não modela | Afirmada, sem verificação | Aresta tipada, com fonte e confiança |
| Decide prioridade | Sim — a escassez é a virtude | Em parte | Não — descreve, não decide |

O mapa estratégico do BSC é um parente próximo da espinha: também é um
grafo de objetivos com setas de causa e efeito. As diferenças são de
disciplina, não de ideia: o mapa do BSC costuma ser grosseiro (uma
dúzia de caixas), viver em slide, ter setas afirmadas sem evidência e
ser revisado uma vez por ano. Boa parte desses mapas morreu em
apresentação porque ninguém pagava o custo de mantê-los — e é essa
economia que a manutenção por LLM muda (adiante).

A relação saudável entre os três é de empilhamento: o grafo é o
substrato; OKR (ou o ritual que a organização preferir) é o protocolo
de direção por cima. Prioridades de ciclo podem nascer como cenários
To-Be e objetivos ligados ao grafo — aí cada key result rastreia até a
capacidade e o sistema que produzem o número, coisa que uma planilha
de OKRs não dá.

Vale registrar também o que OKR e BSC fazem melhor. Um mapa não decide
nada — descreve; a escassez brutal do OKR (3–5 objetivos, o resto é
explicitamente não-prioridade) é uma virtude que o grafo não tem.
OKR e BSC trazem ritual (check-ins, revisões) que cria batimento
organizacional; o grafo precisa tomar isso emprestado. E OKR cabe numa
planilha que qualquer pessoa entende em uma hora, enquanto o grafo
exige um contrato de formato — o custo de adoção é real.

## Métricas em dois níveis, sem a camada do meio

No vocabulário de relações, `measures` liga um dado a exatamente três
destinos: `objective`, `value-stage` ou `capability`. Isso acomoda
métricas de governança (a margem medindo o objetivo da cafeteria) e
métricas de processo (a ruptura de insumos medindo a capacidade de
abastecer) — e, deliberadamente, nenhum andar intermediário.

O BSC resolve a ponte entre o número operacional e o número da
diretoria com uma camada tática de gerentes. No grafo essa camada não
existe como estrutura, porque as duas funções dela se resolvem de
outro jeito:

- **Responsabilidade** ("quem cuida disso") é atributo — a área no
  frontmatter — e não caixa. Pessoas não viram caixas; um andar de
  gerentes seria organograma disfarçado de mapa, e organograma muda
  mais rápido que processo.
- **Decomposição** ("como o número do processo move o número da
  diretoria") já existe como caminho no grafo: a métrica de ruptura
  mede a capacidade de abastecer, que por `enables`/`advances` chega
  ao objetivo que a margem mede. "Que processos movem este número?" é
  uma consulta (`focus`, `impacto`), não uma camada. O que no BSC é
  estrutura, aqui é computável.

A escada de confiança se aplica a métricas como a qualquer caixa: uma
métrica definida mas que ninguém calcula é `hypothesis`; calculada e
conferida, `certified`; batendo com o fechamento, `validated`. Um
scorecard clássico não distingue "número em que confiamos" de "número
que alguém digitou" — aqui a distinção é parte do contrato.

## O padrão LLM Wiki

Em 2026, Andrej Karpathy publicou o
[LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f):
em vez de RAG sobre documentos crus, a LLM constrói e mantém um wiki
persistente de Markdown interligado — fontes imutáveis embaixo, wiki
mantido pela LLM no meio, um documento de schema que disciplina o
agente por cima; três operações (ingest, query, lint). A tese
econômica: wikis morrem porque o custo de manutenção cresce mais
rápido que o valor; com a LLM fazendo o bookkeeping, esse custo cai
perto de zero.

Um mapa em camadas é uma instância desse padrão — a correspondência é
quase termo a termo:

| LLM Wiki (Karpathy) | Grafo em camadas |
|---|---|
| Raw sources (imutáveis) | Fontes citadas nas evidências: transcrições, repositórios, documentos |
| The wiki (Markdown escrito pela LLM) | O vault de caixas |
| The schema (CLAUDE.md, convenções) | O [Guia](guia-grafo-em-camadas.md) + o [contrato](contrato-de-formatos.md) + as skills — com compilador e tipos, não só convenção |
| Ingest | Skill `entrevistar` (uma fonte toca várias caixas) |
| Query | As lentes: `resumo`, `focus`, `impacto`, `view` |
| Lint | Skills `lacunas` e `revisao-nuclear` |
| index.md | `graph.yaml` + `resumo` |
| CLI tools (opcional) | A ferramenta inteira |

As diferenças são o que o contexto de organização exige do contexto
pessoal:

- **Contrato executável em vez de convenção**: o schema do LLM Wiki é
  um texto que o agente procura seguir; aqui é um compilador que
  valida tipos, relações e combinações proibidas, com `check` como
  gate.
- **Confiança explícita**: cada caixa carrega o quanto se pode confiar
  nela (`hypothesis` → `certified` → `validated`), porque um mapa de
  operação sustenta decisões, não só leitura.
- **Gates humanos**: no padrão original a LLM mantém tudo e o humano
  só curadoria fontes — razoável quando uma página errada custa pouco.
  Num mapa de organização, promover status é decisão de governança, e
  revisão adversarial precede consolidação.

Em uma frase: um mapa em camadas é um LLM wiki com governança — mais
lento de alimentar, em troca de ser confiável o bastante para se
decidir em cima dele.
