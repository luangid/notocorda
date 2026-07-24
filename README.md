# Notocorda

**Mapeamento dirigido por uma espinha dorsal de etapas lógicas independentes
da operação, com fluxo de valor e diagrama de dependência funcional.**

![O As-Is de uma cafeteria: espinha de valor no eixo, capacidades penduradas
nela, realizações agrupadas por área e problemas em vermelho](docs/exemplo-cafeteria.png)

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

Quem escreve, escreve **prosa em Markdown**. Quem lê, lê um **mapa**. Agentes
de IA leem a **mesma verdade em YAML**. Uma fonte, três leituras — e a fonte
é texto versionado em git, não um desenho que alguém precisa lembrar de
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
./notocorda --listar           # que mapas existem por perto
./notocorda ../meu-vault       # a PASTA da documentação — compila e abre
./notocorda --web 8137         # só serve, sem janela nativa
```

## Como está organizado

| Pasta | O que é |
|---|---|
| `viewer/` | O mapa: HTML + canvas. Desenho, layout, navegação. Consome **só** o `graph.json`. |
| `compiler/` | Markdown → `graph.json` (o que a tela lê) → `graph.yaml` (o que a IA lê). Valida contra os schemas. |
| `desktop/` | Janela nativa e ponte para o Python: abrir o documento de origem, salvar view, revalidar. |
| `schemas/` | O contrato executável: frontmatter de documento, forma do `graph.json`, vocabulário de relações. |
| `examples/cafeteria/` | Uma cafeteria fictícia documentada por inteiro: espinha, dois cenários To-Be concorrentes, cinco problemas, evidências. É a prova de conceito. |
| `docs/` | [O método](docs/guia-grafo-em-camadas.md) e o [contrato de formatos](docs/contrato-de-formatos.md). |

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
e a camada de IA descrita no §16 do Guia. O visualizador tem arestas soltas —
é um v0 de verdade, não um produto.

## Licença

Código e textos sob [MIT](LICENSE). As fontes Fraunces e IBM Plex,
redistribuídas em `viewer/fonts/`, estão sob SIL Open Font License 1.1 — ver
[NOTICE](NOTICE).

O método e a ferramenta nasceram de um trabalho de mapeamento do modelo
operacional da **Serlares**, empresa de alimentação coletiva. O mapa da
empresa não é publicado: o exemplo que acompanha o repositório é uma
cafeteria fictícia, escrita para demonstrar o formato.
