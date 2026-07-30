# Notocorda

**Mapeamento dirigido por uma espinha dorsal de etapas lógicas independentes
da operação, com fluxo de valor e diagrama de dependência funcional.**

Além da metodologia de mapeamento, a documentação operacional foi planejada
para o **paralelismo entre a análise de pessoas e a de LLMs**: um
visualizador (aplicativo de desktop ou página HTML) para a análise visual, e
um conjunto de ferramentas de linha de comando que serve de interface para
agentes de IA — os dois lendo o mesmo grafo derivado.

![O As-Is de uma cafeteria: espinha de valor no eixo, capacidades penduradas
nela, realizações reunidas em nuvens por área e problemas em vermelho, no
sopé de cada nuvem](docs/exemplo-cafeteria.png)

## A ideia

Quase toda documentação de processo descreve **o que a empresa faz hoje**.
Quando o "hoje" muda, ela morre — e ninguém sabe dizer o que se perdeu.

Notocorda parte do outro lado: primeiro se escreve a **espinha** — as etapas
lógicas que precisam ser verdade para a organização cumprir sua finalidade,
*independentemente* de quem executa, de qual sistema e de qual modelo
operacional. Uma cafeteria precisa abastecer, preparar, coletar o pedido,
entregar, receber e fidelizar. Isso vale para a loja única de bairro e para a
rede com aplicativo — muda o **como**, não o **quê**.

Em torno dessa espinha penduram-se as camadas do como: realizações (o jeito
atual de fazer), sistemas, dados, evidências e problemas. Cada ligação é
tipada, então o mapa é um **grafo de dependência funcional**: dá para partir
de um problema e caminhar até a evidência que prova que ele existe, ou até a
etapa de valor que ele ameaça. E como a espinha não depende do modelo
operacional, um cenário **To-Be** é só outra camada sobre a mesma espinha —
as duas comparáveis, lado a lado, no mesmo mapa.

O nome vem da biologia: a **notocorda** é o eixo flexível que organiza o
corpo dos cordados *antes* de existir esqueleto. A vértebra vem depois; o
eixo vem primeiro.

## A tese: documentação executável

Quem escreve, escreve **prosa em Markdown**. A partir daí, a mesma fonte é
servida em duas projeções:

- **Pessoas** abrem o mapa — camadas, nuvens de área, cenários As-Is/To-Be
  comparáveis, foco e vizinhança.
- **Agentes de IA** leem o `graph.yaml` (o grafo por extenso, com as
  relações escritas como frases) e consultam as lentes de terminal —
  operações análogas às do mapa, devolvendo recortes em vez de desenho.

A intenção é que uma pessoa e um LLM possam analisar a mesma operação em
paralelo, cada um pela interface que lhe é adequada — e que uma divergência
entre os dois possa ser discutida apontando para o mesmo nó. A fonte é
texto versionado em git, não um desenho que alguém precisa lembrar de
atualizar.

Isto não é promessa: é o que o repositório faz. O comando abaixo reconstrói
o `graph.json` da cafeteria a partir dos Markdown de autoria, e o resultado é
**idêntico** ao arquivo versionado.

```bash
python3 compiler/build_graph.py examples/cafeteria /tmp/cafe.json schemas
diff <(jq 'del(.generated_at)' examples/cafeteria/graph.json) \
     <(jq 'del(.generated_at)' /tmp/cafe.json) && echo "os Markdown geram o mapa"
```

O mesmo comando grava um `graph.yaml` ao lado: a projeção legível por agente,
com as relações escritas por extenso e as lacunas que a validação encontrou.
`compiler/auditar_yaml.py` confere que a projeção conserva tudo o que o mapa
desenha — nada some no caminho, nada aparece do nada.

## Rodar

O caminho curto, sem instalar nada — o mapa é uma página:

```bash
python3 -m http.server 8137    # depois: http://localhost:8137/viewer/
```

Para o compilador e o validador, um venv comum basta:

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python compiler/validate.py examples/cafeteria/graph.json
```

A **janela nativa** (`./notocorda`) usa o WebKit do próprio sistema, e o pip
não entrega isso: o `pywebview` precisa das ligações GTK ou Qt instaladas
fora do venv. No Debian/Ubuntu:

```bash
sudo apt install python3-gi gir1.2-webkit2-4.1
python3 -m venv --system-site-packages .venv   # o venv precisa enxergá-las
.venv/bin/pip install -r requirements.txt
./notocorda                                    # abre o exemplo da cafeteria
```

Outros usos:

```bash
./notocorda --listar           # a estante (★) e o que existe por perto (·)
./notocorda ../meu-vault       # a PASTA da documentação — compila e abre
./notocorda --esquecer NOME    # tira um mapa da estante
./notocorda --web 8137         # só serve, sem janela nativa
```

## As lentes de consulta (a interface dos agentes)

Enquanto uma pessoa navega o mapa, um agente de IA consulta **lentes** —
subcomandos que devolvem recortes do grafo em YAML, no mesmo vocabulário do
`graph.yaml`. As lentes não desenham nada: devolvem o recorte com a
semântica preservada, que é o que um LLM consegue de fato usar.

```bash
./notocorda check ../meu-vault                 # saúde: erros/avisos/lacunas (exit 1 se houver erro)
./notocorda resumo ../meu-vault                # briefing executivo: espinha, cenários, áreas, problemas
./notocorda view ../meu-vault --nivel 0        # o seletor de nível/camadas/áreas da prancha
./notocorda view ../meu-vault --cenario scenario.as-is --sem-tipo evidence --sem-area area.financeiro
./notocorda focus ../meu-vault <id> --raio 2   # o clique numa caixa: vizinhança até N saltos
./notocorda impacto ../meu-vault <id>          # se esta caixa parar, o que para junto? (--reverso inverte)
```

`check` sempre recompila e serve de gate (pre-commit, CI). `impacto` segue
`requires`/`uses`/`enables`/`supports`/`realizes`/`advances` transitivamente,
em ondas de distância — análise de impacto clássica. Pergunte à cafeteria o
que acontece se a maquininha de cartão parar:

```yaml
$ ./notocorda impacto examples/cafeteria/graph.json system.pos-balcao
alvo: system.pos-balcao (POS do balcão)
pergunta: se esta caixa parar, o que para junto?
alcance_total: 10
ondas:
- distancia: 1
  caixas:
  - realization.pagamento-na-maquininha (Pagamento na maquininha) · via …supports→…
  - realization.pedido-no-balcao (Pedido no balcão) · via …supports→…
- distancia: 2
  caixas:
  - capability.gerenciar-pedidos (Gerenciar pedidos) · via …realizes→…
  - capability.processar-pagamentos (Processar pagamentos) · via …realizes→…
- distancia: 3
  caixas:
  - value-stage.coletar-pedido (Coletar pedido) · via …enables→…
  - value-stage.receber-pagamento (Receber pagamento) · via …enables→…
# …e a cascata segue até o objetivo: Servir café com qualidade e margem.
```

No exemplo, a parada da maquininha alcança o objetivo do negócio em cinco
ondas, com o caminho registrado aresta por aresta. As lentes aceitam a
pasta do vault (recompila se estiver velho) ou um `graph.json` direto (usa
como está). Código em `compiler/consulta.py`.

## As skills (o método, executável por agentes)

Além das lentes, o repositório traz em `.claude/skills/` os **rituais do
método** como skills de agente — quem abrir este repositório com o Claude
Code (ou compatível) as recebe prontas. A divisão de trabalho: **a lente
calcula, a skill julga**.

| Skill | O que faz |
|---|---|
| `escrever` | Cria caixas no contrato: decide o tipo (teste da espinha §9.1), gera frontmatter + relações no corpo, valida com `check`. |
| `revisar` | Review adversarial de um lote: fidelidade à fonte, confidence honesta, tipo certo — parecer classificado, nada corrigido em silêncio. |
| `entrevistar` | O ciclo de mapeamento As-Is: roteiro mirado nas lacunas → transcrição vira evidência + caixas candidatas → devolução em dias. |
| `lacunas` | 7 detectores de conservação — o que existe no mundo e não está no mapa (capacidade sem cobertura, obrigação sem quitação, dado órfão…). |
| `revisao-nuclear` | A auditoria sistêmica completa do Guia §17: 20 passos, 9 artefatos, patches propostos — nunca aplicados silenciosamente. |

As skills são genéricas — valem para qualquer vault. Uma organização que
adote o método pode sobrepô-las com versões próprias (fontes, gates de
governança, sistemas internos) no `.claude/skills/` do seu workspace, sem
tocar nestas.

## Como está organizado

| Pasta | O que é |
|---|---|
| `viewer/` | O mapa: HTML + canvas. Desenho, layout, navegação. Consome **só** o `graph.json`. |
| `compiler/` | Markdown → `graph.json` (o que a tela lê) → `graph.yaml` (o que a IA lê). Valida contra os schemas. |
| `desktop/` | Janela nativa e ponte para o Python: abrir o documento de origem, salvar view, revalidar. |
| `schemas/` | O contrato executável: frontmatter de documento, forma do `graph.json`, vocabulário de relações. |
| `examples/cafeteria/` | Uma cafeteria fictícia documentada por inteiro: espinha, dois cenários To-Be concorrentes, cinco problemas, evidências. É a prova de conceito. |
| `docs/` | [O método](docs/guia-grafo-em-camadas.md), o [contrato de formatos](docs/contrato-de-formatos.md) e [onde isto se encaixa entre OKR, BSC e o padrão LLM Wiki](docs/okr-bsc-e-llm-wiki.md). |

A interface é **uma só** para desktop e web: `viewer/bridge.js` é o único
arquivo que sabe onde está rodando. Hoje há uma janela nativa; amanhã, um
servidor com login e leitura do git — sem tela nova.

E a ferramenta não pertence a mapa nenhum: aponte `./notocorda` para a
**pasta da documentação** de qualquer organização, dentro ou fora deste
repositório. Ela compila os Markdown se o grafo faltar ou estiver velho — de
modo que o que se abre é sempre a pasta que se escreve, nunca o arquivo
derivado.

## Estado

**v0, em construção.** O que já se sustenta: o formato, o compilador (com o
ida-e-volta da cafeteria fechando exato), a validação contra o contrato e o
visualizador em camadas, com As-Is, To-Be e comparação entre cenários.

O que ainda não existe: edição gráfica gravando de volta nos arquivos de
autoria (hoje o mapa é leitura e views), diff visual completo entre cenários
e o restante da camada de IA do §16 do Guia (as lentes de consulta são o
primeiro passo dela; faltam as lentes derivadas — matriz capacidade × área,
fronteiras entre áreas, dossiê de problema — e o servidor MCP). O
visualizador tem arestas soltas — é um v0 de verdade, não um produto.

## Licença

Código e textos sob [MIT](LICENSE). As fontes Fraunces e IBM Plex,
redistribuídas em `viewer/fonts/`, estão sob SIL Open Font License 1.1 — ver
[NOTICE](NOTICE).

O método e a ferramenta nasceram de um trabalho de mapeamento do modelo
operacional da **Serlares**, empresa de alimentação coletiva. O mapa da
empresa não é publicado: o exemplo que acompanha o repositório é uma
cafeteria fictícia, escrita para demonstrar o formato.
