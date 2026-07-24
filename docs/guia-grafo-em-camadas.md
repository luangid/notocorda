---
id: guia-implementacao-grafo-camadas-atlas
title: "Guia de Implementação — Grafo em Camadas do Atlas"
subtitle: "Contrato documental, semântico e técnico do Atlas"
type: implementation-guide
status: draft
version: "0.2"
created_at: 2026-07-23
reviewed_at: 2026-07-24
classification: public
tags:
  - atlas
  - grafo
  - arquitetura-de-negocio
  - documentacao
  - implementacao
  - inteligencia-artificial
---

# Guia de Implementação — Grafo em Camadas do Atlas

> Este guia define as regras para documentar, conectar, validar, versionar e apresentar o conhecimento do Atlas. Ele é um contrato para pessoas, compiladores e agentes de IA.

## 1. Decisão arquitetural

O Atlas será implementado como uma base documental versionada capaz de gerar um grafo semântico.

As decisões fundamentais são:

1. Cada elemento relevante é descrito em um arquivo Markdown.
2. O frontmatter YAML identifica e classifica o elemento.
3. O corpo do Markdown explica seu significado.
4. Wikilinks tipados declaram relações semânticas.
5. Áreas são documentos contextuais representados visualmente como nuvens.
6. Cenários selecionam diferentes realizações sem alterar a espinha dorsal.
7. Arestas, backlinks, nuvens, contadores, índices e layouts são projeções derivadas.
8. Markdown, YAML, wikilinks e Git constituem a fonte canônica.
9. Bancos, arquivos JSON, embeddings e visualizações são reconstruíveis.
10. A IA consulta o conhecimento livremente, mas altera a fonte canônica apenas por proposta versionada.

Em forma resumida:

> Cada caixa é um documento Markdown atômico. O frontmatter identifica e classifica; o corpo explica; os wikilinks tipados declaram relações; as áreas agrupam; os cenários contextualizam; o compilador valida; e o grafo projeta.

## 2. Resultado esperado

O Atlas deverá permitir que uma pessoa ou agente:

- parta de um objetivo, etapa de valor, capacidade ou invariante;
- descubra como o elemento é realizado em determinado cenário;
- encontre sistemas, dados, evidências e problemas relacionados;
- compreenda o contexto das áreas envolvidas;
- compare o As-Is com alternativas To-Be;
- diferencie necessidade essencial de escolha operacional;
- identifique lacunas, contradições e documentos desatualizados;
- execute análise de impacto;
- abra os arquivos que sustentam cada afirmação;
- proponha alterações por patch, commit ou pull request;
- reconstrua todo o índice navegável a partir dos arquivos-fonte.

O Atlas não deve ser apenas uma coleção de páginas conectadas. Ele deve funcionar como uma cartografia operacional versionada da empresa.

## 3. Princípios obrigatórios

### 3.1 Uma fonte da verdade, várias projeções

O conhecimento canônico será mantido em Markdown e YAML, versionado pelo Git.

A aplicação web, o grafo visual, o banco de consulta, os índices de busca, os embeddings e as ferramentas para IA são projeções. Nenhuma projeção poderá criar uma segunda fonte da verdade silenciosa.

### 3.2 A espinha é a base semântica

A espinha dorsal representa o que precisa existir para o negócio entregar valor, e não a forma como a empresa trabalha atualmente.

Os elementos da espinha devem possuir IDs estáveis e servir como âncoras para:

- realizações atuais;
- cenários futuros;
- sistemas;
- dados;
- evidências;
- problemas;
- áreas.

### 3.3 Poucos tipos, significado claro

O Atlas começará com um vocabulário pequeno.

Um novo tipo somente poderá ser criado quando:

1. nenhum tipo existente representar o conceito adequadamente;
2. a distinção produzir comportamento diferente no compilador, na governança ou na interface;
3. houver pelo menos dois exemplos reais que justifiquem o tipo;
4. a alteração for aprovada na governança do Atlas.

Não criar tipos apenas para melhorar a aparência do grafo.

### 3.4 Relações são declaradas nos documentos

As relações não serão mantidas manualmente em uma ferramenta visual.

Elas serão declaradas no corpo do Markdown por meio de:

```md
- `tipo-da-relacao` → [[id-do-destino|Título legível]]
```

O grafo visual apenas renderiza essas declarações.

### 3.5 Relações são declaradas uma única vez

Cada relação possui uma origem responsável por declará-la.

O destino não deve repetir manualmente a relação inversa. Backlinks e relações inversas são gerados pelo compilador.

### 3.6 IDs são permanentes

Títulos, textos e diretórios podem mudar. IDs não.

O nome do arquivo deve ser igual ao ID:

```text
capability.gerenciar-pedidos.md
system.erp-legado.md
problem.ruptura-de-estoque.md
```

O título humano fica dentro do documento.

### 3.7 As-Is e To-Be são cenários

“Atual” e “futuro” não são tipos de caixa.

São contextos nos quais determinadas realizações, sistemas, dados, evidências e problemas são válidos.

A mesma espinha pode possuir:

- uma realização atual;
- várias alternativas futuras;
- pilotos;
- cenários rejeitados;
- cenários aposentados.

### 3.8 Ausência é informação

O Atlas não deve inventar ligações para esconder lacunas.

Uma capacidade sem realização, um problema sem evidência ou um sistema sem finalidade conhecida deve aparecer como lacuna explícita.

### 3.9 A IA não é fonte da verdade

Agentes podem:

- localizar conhecimento;
- comparar documentos;
- sugerir relações;
- detectar inconsistências;
- produzir patches;
- executar a Revisão Nuclear.

Agentes não podem:

- transformar inferência em fato silenciosamente;
- alterar o conhecimento canônico sem revisão;
- criar invariantes apenas porque uma prática é comum;
- preencher lacunas com respostas plausíveis sem evidência.

## 4. Modelo semântico mínimo

O Atlas possuirá seis tipos de caixas e três tipos de documentos contextuais.

### 4.1 Tipos de caixas

| `type` | Família visual | Representa |
|---|---|---|
| `spine` | Modelo essencial | Elemento da espinha dorsal |
| `realization` | Realizações | Forma escolhida para realizar parte da espinha |
| `system` | Sistemas | Sistema, ferramenta, integração ou automação |
| `data` | Dados | Tabela, API, arquivo, indicador ou produto de dados |
| `evidence` | Evidências | Documento, entrevista, consulta, decisão ou registro |
| `problem` | Problemas | Problema, risco, oportunidade ou suposição |

Esses seis valores formam a legenda principal do grafo.

### 4.2 Tipos internos da espinha

Todo documento `type: spine` deve declarar `spine_kind`.

| `spine_kind` | Pergunta respondida |
|---|---|
| `objective` | Qual resultado ou condição desejada orienta o negócio? |
| `value-stage` | Que transformação precisa acontecer no fluxo de valor? |
| `capability` | O que a empresa precisa ser capaz de fazer? |
| `invariant` | O que deve permanecer verdadeiro? |
| `event` | Que acontecimento relevante altera o estado do negócio? |
| `obligation` | O que se torna devido, exigível ou necessário após um evento? |

Exemplos:

```yaml
type: spine
spine_kind: value-stage
```

```yaml
type: spine
spine_kind: capability
```

```yaml
type: spine
spine_kind: invariant
```

### 4.3 Documentos contextuais

| `type` | Representação | Função |
|---|---|---|
| `area` | Nuvem | Explica o contexto de uma área e agrupa documentos |
| `scenario` | Seletor de cenário | Define As-Is, To-Be, piloto ou alternativa |
| `view` | Visão salva | Define filtros, níveis, posição e apresentação |

`area`, `scenario` e `view` não são caixas comuns da legenda principal.

### 4.4 O que não será tipo na V1

Os conceitos abaixo não terão tipos independentes inicialmente:

| Conceito | Representação na V1 |
|---|---|
| Modelo operacional | `realization` |
| Processo | `realization` |
| Papel operacional | Explicado na realização ou na área |
| Unidade organizacional | `area` ou conteúdo da realização |
| Integração | `system` |
| Automação | `system` |
| Ferramenta | `system` |
| Ativo de dados | `data` |
| Indicador | `data` |
| Decisão | `evidence` |
| Risco | `problem` |
| Oportunidade | `problem` |
| Suposição | `problem` |
| Regra de negócio | Conteúdo de um invariante ou realização |
| Conceito de domínio | Definição dentro do documento mais próximo |

Subtipos opcionais poderão ser introduzidos futuramente sem alterar a família visual:

```yaml
realization_kind: process
system_kind: integration
data_kind: indicator
evidence_kind: interview
problem_kind: risk
```

Esses campos não são obrigatórios na V1.

## 5. Contrato de um documento

### 5.1 Regra de atomicidade

Um arquivo atômico representa um elemento com identidade própria.

Um documento é atômico quando:

- possui um único ID;
- possui um tipo principal;
- pode ser ligado e revisado independentemente;
- pode mudar sem exigir a reescrita completa de outro documento;
- possui definição suficientemente clara para uma pessoa ou agente.

Atomicidade não significa texto curto. Um documento pode ser extenso se continuar representando uma única coisa.

Entrevistas, manuais e relatórios que descrevem vários elementos podem permanecer inteiros como `evidence`.

### 5.2 Campos obrigatórios

Todo documento participante do grafo deve possuir:

```yaml
---
id:
type:
status:
---
```

Todo `type: spine` também deve possuir:

```yaml
spine_kind:
```

### 5.3 Campos opcionais padronizados

```yaml
aliases: []
areas: []
scenarios: []
tags: []

valid_from:
valid_to:
recorded_at:

confidence:

review:
  owner:
  reviewed_at:
  review_due_at:
```

### 5.4 Valores iniciais de status

| `status` | Significado |
|---|---|
| `draft` | Documento ainda em construção |
| `active` | Documento válido no contexto declarado |
| `deprecated` | Ainda referenciável, mas em retirada |
| `archived` | Mantido apenas para histórico |

Estados específicos de cenário, como `current`, `proposed`, `pilot`, `rejected` e `retired`, pertencem ao documento `scenario`.

### 5.5 IDs e nomes de arquivo

Formato:

```text
<categoria>.<nome-estavel-em-kebab-case>
```

Exemplos:

```text
objective.servir-refeicoes-conformes
value-stage.atender-pedido
capability.gerenciar-pedidos
invariant.insumo-vencido-nao-utilizado
event.entrega-aceita
obligation.pagar-fornecedor
realization.pedido-no-balcao
system.erp-legado
data.erp-movdepos
evidence.entrevista-gerente-loja-2026-07
problem.ruptura-de-estoque
area.operacoes
scenario.loja-unica
view.cafeteria-visao-geral
```

Regras:

- usar letras minúsculas, números, pontos e hífens;
- não incluir caminho de pasta;
- não incluir responsável;
- evitar datas, exceto quando fizerem parte da identidade da evidência;
- não reutilizar ID removido;
- manter aliases quando o conceito for renomeado;
- usar o ID como nome do arquivo.

### 5.6 Estrutura mínima do corpo

```md
# Título humano

## Definição

Definição curta, suficiente e não circular.

## Papel no negócio

Por que este elemento existe e que resultado ajuda a produzir.

## Relações

- `relation-type` → [[target-id|Título do destino]]

## Evidências

- `evidences` → [[target-id|Título do elemento evidenciado]]

## Problemas ou questões abertas

Pontos ainda incertos, contraditórios ou incompletos.
```

Nem todo tipo precisa preencher todas as seções. Seções vazias devem ser omitidas.

## 6. Wikilinks e relações

### 6.1 Wikilink canônico

Formato:

```md
[[id-do-documento|Título legível]]
```

Exemplo:

```md
[[capability.gerenciar-pedidos|Gerenciar pedidos]]
```

O destino lógico é o ID. O título após `|` serve apenas para leitura.

### 6.2 Relação canônica

Formato:

```md
- `relation-type` → [[target-id|Título legível]]
```

Exemplo:

```md
- `realizes` → [[capability.gerenciar-pedidos|Gerenciar pedidos]]
```

O compilador deve interpretar:

- documento atual como origem;
- conteúdo entre crases como tipo;
- wikilink como destino.

### 6.3 Toda relação deve formar uma frase

```text
[origem] [relação] [destino]
```

Exemplos válidos:

```text
Pedido no balcão realiza Gerenciar pedidos.
Sistema de PDV apoia Pedido no balcão.
Histórico de faltas evidencia Ruptura de estoque.
Ruptura de estoque afeta Garantir disponibilidade.
Entrega aceita cria Pagar fornecedor.
```

Se a frase não fizer sentido, a direção ou o tipo da relação provavelmente está errado.

### 6.4 Vocabulário inicial de relações

| Relação | Origem típica | Destino típico | Significado |
|---|---|---|---|
| `advances` | `value-stage` | etapa ou objetivo | Produz avanço no fluxo de valor |
| `requires` | qualquer caixa | qualquer caixa | Não funciona adequadamente sem |
| `enables` | capacidade | etapa ou capacidade | Torna possível |
| `constrains` | invariante | caixa | Impõe uma condição |
| `triggers` | evento | realização ou evento | Dispara |
| `creates` | evento | obrigação | Faz surgir |
| `realizes` | realização | espinha | Materializa uma necessidade essencial |
| `supports` | sistema | realização ou espinha | Apoia tecnicamente |
| `uses` | realização ou sistema | dado | Consome |
| `records` | dado | evento ou elemento da espinha | Registra |
| `measures` | dado | objetivo, etapa ou capacidade | Mede |
| `evidences` | evidência | qualquer elemento | Sustenta uma afirmação |
| `contradicts` | evidência | qualquer elemento | Apresenta evidência contrária |
| `affects` | problema | qualquer elemento | Afeta negativamente ou introduz incerteza |
| `mitigates` | realização, sistema ou controle documentado | problema | Reduz |
| `motivates` | problema | realização, sistema ou cenário | Justifica uma mudança |
| `replaces` | realização ou sistema | elemento da mesma família | Substitui em determinado cenário |
| `derived-from` | qualquer elemento | evidência ou elemento | Foi derivado de |
| `related-to` | qualquer elemento | qualquer elemento | Relação ainda não refinada |

`related-to` é permitido apenas como relação provisória e deve gerar aviso.

### 6.5 Relação declarada em um lado

Exemplo:

```md
# Pedido no balcão

## Relações

- `realizes` → [[capability.gerenciar-pedidos|Gerenciar pedidos]]
```

Não repetir no arquivo da capacidade:

```md
- `realized-by` → [[realization.pedido-no-balcao]]
```

O backlink é derivado.

### 6.6 Cenário da relação

Na V1, uma relação herda os cenários do documento de origem.

Se a mesma realização possuir relações diferentes em cenários diferentes, devem ser criados documentos de realização separados.

Evitar colocar lógicas concorrentes dentro do mesmo arquivo.

## 7. Áreas como nuvens documentadas

### 7.1 Área é documento

Cada área deve possuir arquivo próprio:

```text
area.operacoes.md
area.financeiro.md
area.transformacao-digital.md
```

O arquivo da área explica:

- propósito;
- escopo;
- responsabilidades;
- fronteiras;
- interfaces;
- capacidades relevantes;
- sistemas e dados importantes;
- problemas conhecidos;
- diferenças entre cenários.

### 7.2 Área não é caixa comum

Uma área é renderizada como nuvem ao redor dos documentos que pertencem a ela.

Não devem ser exibidas setas ligando cada caixa à área.

### 7.3 Pertencimento por wikilink

Os documentos declaram suas áreas no frontmatter:

```yaml
areas:
  - "[[area.operacoes|Operações]]"
  - "[[area.transformacao-digital|Transformação Digital]]"
```

O compilador registra o pertencimento como propriedade:

```json
{
  "id": "realization.pedido-pelo-app",
  "areas": [
    "area.operacoes",
    "area.transformacao-digital"
  ]
}
```

Essa propriedade não precisa gerar aresta em `edges.json`.

### 7.4 Múltiplas áreas

Um documento pode pertencer a várias áreas.

A interface deve suportar nuvens sobrepostas ou outra representação equivalente definida pela visão.

Pertencer a uma área significa possuir contexto relevante naquela área. Não significa automaticamente que a área executa ou responde integralmente pelo elemento.

### 7.5 Contador da nuvem

O número exibido ao lado da área é derivado:

```text
OPERAÇÕES · 11
```

Ele representa a quantidade de documentos visíveis pertencentes àquela área na visão, nos filtros e no cenário atuais.

O contador nunca é escrito manualmente no arquivo da área.

### 7.6 Clique na nuvem

Ao selecionar uma área, a interface deve permitir:

- abrir o documento da área;
- destacar seus documentos;
- filtrar por tipo;
- ver problemas, sistemas, dados e evidências relacionados;
- comparar a área entre cenários;
- navegar para áreas conectadas por wikilinks presentes no documento.

## 8. Cenários e níveis de visualização

### 8.1 Cenário é documento

Exemplo:

```yaml
---
id: scenario.app-e-fidelidade
type: scenario
status: proposed
baseline: "[[scenario.loja-unica|Loja única]]"
---

# App e fidelidade

## Hipótese

Introduzir pedido e pagamento pelo aplicativo, notificação de pedido pronto
e programa de fidelidade.
```

### 8.2 Cenários não formam necessariamente uma escada

Os cenários podem ser:

- alternativos;
- concorrentes;
- complementares;
- incompatíveis;
- dependentes;
- rejeitados.

Um cenário somente depende de outro quando essa dependência for declarada.

### 8.3 Níveis `-1`, `0`, `+1` e `+2`

Os números utilizados na interface são níveis de visualização, não graus universais de maturidade.

Uma visão pode defini-los assim:

```text
-1  As-Is — loja única
 0  Espinha dorsal
+1  To-Be — app e fidelidade
+2  To-Be — suprimento inteligente
```

Esses números:

- controlam quais sobreposições aparecem;
- não transformam cenários em tipos;
- não significam que `+2` é necessariamente melhor que `+1`;
- não significam que todo cenário precisa passar pelo anterior;
- pertencem ao arquivo `view`, não aos documentos essenciais.

### 8.4 Comparação de cenários

O Atlas deve identificar:

- elementos essenciais preservados;
- realizações adicionadas ou removidas;
- sistemas e dados impactados;
- problemas mitigados ou introduzidos;
- áreas afetadas;
- evidências utilizadas;
- capacidades sem cobertura;
- invariantes ameaçados;
- relações substituídas.

## 9. Regras por tipo de caixa

### 9.1 Espinha

Um elemento da espinha:

- deve ser independente do sistema atual;
- deve ser independente do organograma atual;
- não deve descrever um procedimento específico;
- deve permanecer relevante em mais de uma realização possível;
- deve ligar-se a objetivos, etapas, capacidades, invariantes, eventos ou obrigações.

Pergunta de teste:

> Se trocarmos pessoas, sistemas, fornecedores, local e método, esta necessidade continua existindo?

Se a resposta for não, provavelmente é uma realização.

### 9.2 Realização

Uma realização descreve como parte da espinha é materializada em determinado cenário.

Ela deve:

- declarar ao menos uma relação `realizes`;
- declarar seus cenários;
- explicar entradas, atividades, responsabilidades e saídas relevantes;
- ligar sistemas e dados quando conhecidos;
- não ser promovida automaticamente à espinha.

### 9.3 Sistema

Um sistema deve:

- declarar o que apoia por `supports`;
- possuir área e cenário quando aplicável;
- indicar dados utilizados ou produzidos;
- registrar limitações e dependências relevantes;
- ser marcado como lacuna se sua finalidade empresarial não for conhecida.

### 9.4 Dado

Um dado deve:

- explicar seu significado empresarial;
- indicar o que registra ou mede;
- identificar origem e granularidade quando conhecidas;
- evitar ser descrito apenas por estrutura técnica;
- apontar evidências técnicas quando necessário.

### 9.5 Evidência

Uma evidência deve:

- informar origem;
- informar data ou período;
- diferenciar fato observado de opinião;
- declarar o que `evidences` ou `contradicts`;
- manter o material original acessível quando permitido;
- evitar ser tratada como verdade universal fora de seu escopo.

### 9.6 Problema

Um problema deve:

- indicar o que `affects`;
- registrar evidência ou declarar explicitamente a ausência;
- separar sintoma de possível causa;
- informar escopo e cenário;
- não ser encerrado apenas porque uma solução foi proposta.

Uma oportunidade, risco ou suposição pode ser representada como `problem` com subtipo opcional.

## 10. Exemplo completo — cafeteria

### 10.1 Capacidade

Arquivo `capability.gerenciar-pedidos.md`:

```md
---
id: capability.gerenciar-pedidos
type: spine
spine_kind: capability
status: active
areas:
  - "[[area.operacoes|Operações]]"
scenarios:
  - "[[scenario.espinha-dorsal|Espinha dorsal]]"
---

# Gerenciar pedidos

## Definição

Capacidade de registrar, acompanhar e coordenar pedidos desde sua
solicitação até a entrega ou resolução.

## Papel no negócio

Transforma a intenção do cliente em compromisso operacional conhecido.

## Relações

- `enables` → [[value-stage.atender-pedido|Atender pedido]]
```

### 10.2 Realização atual

Arquivo `realization.pedido-no-balcao.md`:

```md
---
id: realization.pedido-no-balcao
type: realization
status: active
areas:
  - "[[area.operacoes|Operações]]"
scenarios:
  - "[[scenario.loja-unica|Loja única]]"
---

# Pedido no balcão

## Definição

O cliente informa o pedido diretamente ao barista no balcão.

## Relações

- `realizes` → [[capability.gerenciar-pedidos|Gerenciar pedidos]]
- `uses` → [[data.registro-manual-pedidos|Registro manual de pedidos]]
```

### 10.3 Realização futura

Arquivo `realization.pedido-pelo-app.md`:

```md
---
id: realization.pedido-pelo-app
type: realization
status: draft
areas:
  - "[[area.operacoes|Operações]]"
  - "[[area.transformacao-digital|Transformação Digital]]"
scenarios:
  - "[[scenario.app-e-fidelidade|App e fidelidade]]"
---

# Pedido pelo app

## Definição

O cliente registra e acompanha o pedido pelo aplicativo.

## Relações

- `realizes` → [[capability.gerenciar-pedidos|Gerenciar pedidos]]
- `uses` → [[data.pedidos-aplicativo|Pedidos do aplicativo]]
- `replaces` → [[realization.pedido-no-balcao|Pedido no balcão]]
```

### 10.4 Sistema

Arquivo `system.aplicativo-cafeteria.md`:

```md
---
id: system.aplicativo-cafeteria
type: system
status: draft
areas:
  - "[[area.transformacao-digital|Transformação Digital]]"
  - "[[area.operacoes|Operações]]"
scenarios:
  - "[[scenario.app-e-fidelidade|App e fidelidade]]"
---

# Aplicativo da cafeteria

## Relações

- `supports` → [[realization.pedido-pelo-app|Pedido pelo app]]
- `uses` → [[data.pedidos-aplicativo|Pedidos do aplicativo]]
```

### 10.5 Problema

Arquivo `problem.ruptura-de-estoque.md`:

```md
---
id: problem.ruptura-de-estoque
type: problem
status: active
areas:
  - "[[area.operacoes|Operações]]"
  - "[[area.suprimentos|Suprimentos]]"
scenarios:
  - "[[scenario.loja-unica|Loja única]]"
---

# Ruptura de estoque

## Definição

Indisponibilidade de insumo necessário para atender a demanda.

## Relações

- `affects` → [[capability.garantir-disponibilidade|Garantir disponibilidade]]
- `motivates` → [[scenario.suprimento-inteligente|Suprimento inteligente]]

## Evidências

- `derived-from` → [[evidence.historico-faltas-cafeteria|Histórico de faltas]]
```

### 10.6 Área

Arquivo `area.operacoes.md`:

```md
---
id: area.operacoes
type: area
status: active
---

# Operações

## Propósito

Assegurar que produtos e serviços sejam preparados e entregues de acordo
com os requisitos de qualidade, prazo e segurança.

## Escopo

Inclui preparação da operação, atendimento, produção, entrega e
disponibilidade operacional.

## Interfaces

- [[area.suprimentos|Suprimentos]]
- [[area.financeiro|Financeiro]]
- [[area.transformacao-digital|Transformação Digital]]

## Contexto conhecido

O papel da área varia conforme o cenário selecionado. No cenário de app,
parte do registro e acompanhamento do pedido é suportada digitalmente.
```

## 11. Estrutura recomendada

```text
atlas/
├── atlas.config.yaml
├── schemas/
│   ├── document.schema.json
│   ├── relation.schema.json
│   └── manifest.schema.json
├── spine/
│   ├── objectives/
│   ├── value-stages/
│   ├── capabilities/
│   ├── invariants/
│   ├── events/
│   └── obligations/
├── realizations/
├── systems/
├── data/
├── evidence/
├── problems/
├── areas/
├── scenarios/
├── views/
├── decisions/
├── compiler/
└── generated/
```

As pastas facilitam navegação humana. Elas não substituem `type`, `spine_kind` ou ID.

`generated/` contém somente artefatos reconstruíveis e nunca deve ser editado manualmente.

## 12. Projetos externos e documentação distribuída

Cada projeto poderá manter sua documentação Atlas no próprio repositório:

```text
projeto/
└── docs/
    └── atlas/
        ├── atlas.manifest.yaml
        ├── about.md
        ├── realizations/
        ├── systems/
        ├── data/
        ├── evidence/
        └── problems/
```

O projeto referencia a espinha central por wikilink:

```md
- `realizes` → [[capability.garantir-disponibilidade|Garantir disponibilidade]]
```

Regras:

- o projeto não copia a espinha;
- o núcleo central é dono dos elementos essenciais;
- cada projeto é dono de sua implementação;
- referências externas não resolvidas localmente são avisos;
- referências não resolvidas no build central são erros;
- backlinks são gerados centralmente.

## 13. Compilador

### 13.1 Pipeline

1. Ler `atlas.config.yaml`.
2. Descobrir documentos e manifests.
3. Extrair frontmatter.
4. Validar IDs, tipos e campos.
5. Resolver wikilinks.
6. Extrair relações tipadas do corpo.
7. Validar origem, relação e destino.
8. Resolver áreas e cenários.
9. Gerar backlinks.
10. Calcular lacunas e cobertura.
11. Produzir diff semântico.
12. Construir índices de consulta.
13. Gerar projeções.

### 13.2 Saídas

```text
generated/
├── nodes.json
├── edges.json
├── memberships.json
├── backlinks.json
├── graph.json
├── search-index.json
├── source-map.json
├── coverage-report.json
├── semantic-diff.json
└── validation-report.json
```

`memberships.json` contém áreas e outros agrupamentos não renderizados como arestas.

### 13.3 Estrutura derivada

```json
{
  "nodes": [
    {
      "id": "realization.pedido-pelo-app",
      "type": "realization",
      "status": "draft",
      "areas": [
        "area.operacoes",
        "area.transformacao-digital"
      ],
      "scenarios": [
        "scenario.app-e-fidelidade"
      ],
      "source": {
        "repository": "atlas-core",
        "path": "realizations/realization.pedido-pelo-app.md",
        "commit": "..."
      }
    }
  ],
  "edges": [
    {
      "source": "realization.pedido-pelo-app",
      "type": "realizes",
      "target": "capability.gerenciar-pedidos"
    }
  ]
}
```

## 14. Validação

### 14.1 Erros que bloqueiam publicação

- ID duplicado;
- nome de arquivo diferente do ID;
- tipo inexistente;
- `spine` sem `spine_kind`;
- YAML inválido;
- wikilink interno não resolvido;
- relação inexistente;
- combinação proibida de origem, relação e destino;
- cenário inexistente;
- área inexistente;
- alteração destrutiva de ID sem migração;
- documento com lógicas concorrentes de cenários incompatíveis.

### 14.2 Avisos

- `related-to` ainda não refinado;
- documento sem ligação direta ou indireta com a espinha;
- realização sem `realizes`;
- sistema sem `supports`;
- dado sem `records` ou `measures`;
- evidência que não evidencia nem contradiz nada;
- problema sem `affects`;
- problema sem evidência;
- documento sem área;
- documento sem cenário quando deveria possuí-lo;
- revisão vencida;
- baixa confiança;
- elemento órfão;
- possível duplicação semântica;
- documento excessivamente amplo;
- capacidade sem realização no cenário atual;
- realização sem evidência.

### 14.3 Cobertura

O compilador deve responder:

- Quais elementos da espinha não possuem realização no cenário atual?
- Quais realizações não chegam à espinha?
- Quais sistemas não apoiam nada?
- Quais dados não possuem significado documentado?
- Quais problemas não possuem evidência?
- Quais evidências não sustentam nenhuma afirmação?
- Quais documentos não pertencem a nenhuma área?
- Quais áreas possuem documentos conflitantes?
- Quais cenários ameaçam invariantes?
- Quais wikilinks são genéricos ou ainda não refinados?

## 15. Views e apresentação

Coordenadas, cores, formas, níveis e filtros não pertencem aos documentos de negócio.

Um arquivo `view` pode definir:

```yaml
---
id: view.cafeteria-visao-geral
type: view
status: active

scenario_levels:
  - level: -1
    scenario: "[[scenario.loja-unica|Loja única]]"
  - level: 0
    scenario: "[[scenario.espinha-dorsal|Espinha dorsal]]"
  - level: 1
    scenario: "[[scenario.app-e-fidelidade|App e fidelidade]]"
  - level: 2
    scenario: "[[scenario.suprimento-inteligente|Suprimento inteligente]]"

visible_types:
  - spine
  - realization
  - system
  - data
  - evidence
  - problem

show_area_clouds: true
show_area_edges: false
---
```

Se houver posições manuais:

```yaml
layout:
  capability.gerenciar-pedidos:
    x: 500
    y: 120
```

O mesmo conhecimento poderá ser apresentado como:

- grafo;
- tabela;
- árvore;
- linha do tempo;
- mapa executivo;
- comparação de cenários;
- interface conversacional.

## 16. Consulta por pessoas e agentes

### 16.1 Operações mínimas

- pesquisar por texto, tipo, área, cenário ou status;
- abrir um documento;
- listar relações e backlinks;
- navegar até a espinha;
- filtrar por família visual;
- selecionar nível da visão;
- comparar cenários;
- abrir evidências;
- listar lacunas;
- executar análise de impacto;
- abrir histórico e arquivo-fonte.

### 16.2 Operações para agentes

```text
search_documents(query, types, areas, scenarios)
get_document(document_id)
get_neighbors(document_id, relation_types, direction, depth)
trace_to_spine(document_id)
compare_scenarios(baseline_id, candidate_id)
impact_analysis(document_id, proposed_change)
find_coverage_gaps(scenario_id)
get_evidence(document_id)
get_area_context(area_id)
validate_proposed_patch(files)
run_nuclear_review(scope)
```

### 16.3 Respostas auditáveis

Toda resposta estrutural deve poder retornar:

- IDs;
- relações percorridas;
- cenários considerados;
- áreas;
- arquivos-fonte;
- commit de origem;
- evidências;
- confiança quando aplicável.

Embeddings ajudam a localizar conteúdo. O grafo sustenta dependências e impactos. Um não substitui o outro.

## 17. Revisão Nuclear do Atlas

### 17.1 Finalidade

A Revisão Nuclear é uma auditoria sistêmica e deliberadamente ampla.

Ela não revisa apenas um documento. Ela revisa:

- a vault completa;
- o grafo compilado;
- os cenários;
- a cobertura da espinha;
- as áreas;
- as evidências;
- as contradições;
- as consequências de mudanças.

### 17.2 Execução

A Revisão Nuclear deve:

1. compilar todo o Atlas;
2. validar todos os documentos;
3. percorrer cada elemento da espinha;
4. inspecionar suas realizações em todos os cenários;
5. procurar falsos invariantes;
6. detectar capacidades duplicadas;
7. encontrar elementos sem caminho até a espinha;
8. identificar capacidades sem cobertura;
9. verificar vazamento entre cenários;
10. localizar problemas sem evidência;
11. localizar evidências órfãs;
12. localizar sistemas sem finalidade;
13. localizar dados sem significado empresarial;
14. procurar contradições entre documentos;
15. procurar responsabilidades ou contextos conflitantes entre áreas;
16. detectar dependências circulares suspeitas;
17. revisar documentos vencidos;
18. verificar se ganhos locais ameaçam resultados globais;
19. avaliar mudanças sobre todos os invariantes afetados;
20. produzir relatório e patches sugeridos.

### 17.3 Testes contra falsos elementos essenciais

Para cada elemento da espinha:

- continua necessário se o sistema mudar?
- continua necessário se a área responsável mudar?
- continua necessário se a operação for centralizada?
- continua necessário se for automatizado?
- continua necessário em cenários alternativos?
- descreve uma necessidade ou uma prática atual?
- possui evidência ou argumento lógico suficiente?

### 17.4 Teste contra ótimo local

Para cada mudança proposta:

- que resultado local melhora?
- que resultados globais podem piorar?
- quais áreas absorvem novos custos?
- quais invariantes ficam ameaçados?
- quais novas dependências são introduzidas?
- qual problema pode apenas ter sido deslocado?
- quais métricas de proteção devem acompanhar o piloto?
- existe forma de rollback?

### 17.5 Saída

```text
nuclear-review/
├── executive-summary.md
├── critical-findings.md
├── false-invariants.md
├── coverage-gaps.md
├── contradictions.md
├── scenario-leakage.md
├── local-optimum-risks.md
├── stale-documents.md
├── proposed-patches/
└── nuclear-review.json
```

### 17.6 Regra de alteração

A Revisão Nuclear:

- pode sugerir mudanças;
- pode gerar patches;
- não altera silenciosamente o conhecimento canônico;
- deve explicar cada alteração;
- deve apontar documentos e relações afetados;
- deve registrar incerteza;
- deve submeter mudanças essenciais à governança reforçada.

## 18. Fluxo de mudança

### 18.1 Mudança comum

1. Criar branch.
2. Alterar ou adicionar documentos.
3. Executar compilador.
4. Corrigir erros.
5. Avaliar avisos.
6. Revisar diff semântico.
7. Abrir pull request.
8. Obter aprovações.
9. Fazer merge.
10. Publicar novo build.

### 18.2 Diff semântico

O pull request deve apresentar:

```text
Documentos adicionados: 3
Documentos alterados: 2
Relações adicionadas: 5
Relações removidas: 1
Áreas afetadas: 2
Cenários afetados: 1
Capacidades sem realização criadas: 1
Invariantes potencialmente ameaçados: 1
```

### 18.3 Governança

| Mudança | Aprovação mínima |
|---|---|
| Correção textual | Responsável pelo documento |
| Realização As-Is | Responsável operacional |
| Sistema ou dado | Responsável técnico |
| Problema ou evidência | Responsável pelo contexto |
| Cenário To-Be | Responsável pela iniciativa e áreas afetadas |
| Área | Responsável pela área |
| Objetivo, etapa, capacidade, invariante, evento ou obrigação | Negócio e arquitetura do Atlas |
| Remoção de ID essencial | Decisão formal registrada |

Mudanças amplas na espinha devem acionar a Revisão Nuclear.

## 19. Primeiro recorte de implementação

A V1 deve começar com um recorte pequeno e completo:

- uma área;
- um cenário atual;
- um cenário futuro;
- uma etapa de valor;
- duas capacidades;
- um invariante;
- duas realizações;
- um sistema;
- um dado;
- uma evidência;
- um problema.

O objetivo é provar o contrato, não documentar toda a empresa.

## 20. Roadmap

### Marco 0 — Contrato

- registrar os seis tipos de caixas;
- registrar os seis `spine_kind`;
- registrar áreas, cenários e views;
- definir schema;
- definir relações;
- criar templates.

Critério:

> Pessoas e agentes conseguem criar documentos compatíveis sem interpretar regras implícitas.

### Marco 1 — Compilador

- parser de frontmatter;
- parser de wikilinks tipados;
- validação;
- resolução de IDs;
- backlinks;
- memberships;
- `graph.json`;
- relatórios.

Critério:

> Uma referência quebrada bloqueia o build e uma relação válida aparece no grafo.

### Marco 2 — Protótipo visual

- seis famílias da legenda;
- nuvens de áreas;
- seleção de cenário;
- níveis da visão;
- detalhes do documento;
- filtros.

Critério:

> A cafeteria imaginária pode ser reconstruída integralmente a partir dos Markdown.

### Marco 3 — Primeiro recorte real

- selecionar um fluxo real;
- documentar espinha;
- documentar As-Is observado;
- conectar sistemas, dados, evidências e problemas;
- criar pelo menos um cenário futuro.

Critério:

> É possível partir de um problema real e chegar à evidência, realização, capacidade e etapa de valor.

### Marco 4 — IA

- busca híbrida;
- API ou MCP;
- respostas auditáveis;
- patches validados;
- análise de impacto;
- primeira Revisão Nuclear.

Critério:

> Um agente responde perguntas estruturais e propõe mudanças sem tratar inferências como fatos.

### Marco 5 — Federação

- manifests de projetos;
- referências entre repositórios;
- catálogo central;
- governança distribuída;
- integração contínua.

Critério:

> Um projeto documenta sua implementação e se conecta à espinha sem duplicá-la.

## 21. Antipadrões

Evitar:

- criar um tipo para cada substantivo;
- desenhar toda a empresa antes de validar o contrato;
- usar pastas como tipos;
- usar títulos como IDs;
- duplicar a espinha em projetos;
- declarar a mesma relação nos dois lados;
- desenhar relações apenas na interface;
- guardar coordenadas nos documentos de negócio;
- mostrar setas para áreas;
- usar áreas como substitutas de responsabilidade;
- transformar níveis visuais em escala obrigatória de maturidade;
- tratar todo To-Be como evolução linear;
- classificar prática atual como invariante;
- aceitar relação genérica indefinidamente;
- considerar documentação declarada como realidade observada;
- permitir que agentes publiquem inferências sem revisão;
- esconder lacunas;
- construir um grafo completo sem filtros;
- usar embeddings como substitutos das relações;
- editar artefatos de `generated/`.

## 22. Definição de pronto da V1

A primeira versão estará pronta quando:

- existirem apenas os seis tipos de caixas aprovados;
- a espinha utilizar os seis `spine_kind`;
- cada caixa visível corresponder a um Markdown;
- relações forem extraídas de wikilinks tipados;
- backlinks forem derivados;
- áreas possuírem documentos próprios;
- nuvens forem derivadas de `areas`;
- áreas não gerarem arestas visuais;
- cenários forem selecionáveis;
- níveis forem definidos por `view`;
- o cenário atual e uma alternativa puderem ser comparados;
- problemas, sistemas, dados e evidências estiverem representados;
- referências quebradas forem detectadas;
- lacunas forem exibidas;
- uma pessoa e um agente consultarem o mesmo contrato;
- toda resposta estrutural apontar para documentos;
- a Revisão Nuclear produzir um relatório sistêmico;
- todo o grafo puder ser reconstruído.

## 23. Regra final

> O Atlas não documenta apenas como a empresa trabalha. Ele conecta o que o negócio precisa preservar, como isso é realizado, quais sistemas e dados sustentam a operação, quais evidências confirmam o conhecimento, quais problemas desafiam o modelo e quais cenários podem substituí-lo. A fonte é documental e versionada; o grafo é uma projeção; a IA é leitora, crítica e propositora, nunca autoridade silenciosa.
