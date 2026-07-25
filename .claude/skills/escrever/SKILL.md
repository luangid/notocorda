---
name: escrever
description: Criar ou editar documentos (caixas) de um mapa Notocorda no formato do contrato — espinha, realização, sistema, dado/indicador, evidência, problema, área, cenário ou view. Use quando o usuário quiser documentar algo no mapa, criar uma caixa, ou quando outra skill precisar materializar caixas candidatas em arquivos válidos.
---

# Escrever

Transforma conhecimento em caixas válidas do mapa. Nenhum documento nasce
fora do contrato — e as perguntas de modelagem que um autor apressado pula
são feitas aqui.

Referências: `docs/guia-grafo-em-camadas.md` §4 (tipos), §5 (contrato do
documento), §6 (relações), §9 (testes), §11 (pastas); `schemas/registries.yaml`
e `schemas/document.schema.json`; exemplo completo em `examples/cafeteria/`.

## Passo 1 — decidir o tipo

1. **Teste da espinha** (§9.1): "se trocarmos pessoas, sistemas,
   fornecedores, local e método, esta necessidade continua existindo?"
   Sim → `spine` (+ `spine_kind`). Não → continue.
2. Jeito de fazer (processo, rotina)? → `realization`.
3. Ferramenta, integração, automação? → `system`.
4. Tabela, planilha, API ou indicador/KPI? → `data` (KPI = `data` com
   `measures` → objetivo/etapa/capacidade; fórmula, fonte, meta e dono no
   corpo; os VALORES vivem no dashboard, não no mapa).
5. Sustenta/contradiz uma afirmação? → `evidence`. Dor, risco,
   oportunidade? → `problem`.
6. Contexto → `area`, `scenario`, `view`.

Na dúvida entre dois tipos: registrar a dúvida na seção "Problemas ou
questões abertas" do documento — nunca decidir em silêncio.

## Passo 2 — escrever no contrato

- **ID = nome do arquivo** (`<categoria>.<kebab>.md`), permanente, na pasta
  da família (§11).
- Frontmatter mínimo: `id`, `type`, `status` (+ `spine_kind` se spine;
  + `confidence`, `areas`, `scenarios` quando couber). Regras duras:
  **espinha NUNCA declara `areas`** (é independente do organograma; erro de
  contrato — o pertencimento da espinha é derivado das realizações); tudo
  nasce `status: draft` + `confidence: hypothesis`; `certified` só quando a
  fonte diz literalmente aquilo (exceção: `evidence` de fato observado
  nasce `certified` — o CONTEÚDO relatado continua hipótese nas caixas
  derivadas); `validated`/`active` exigem validação humana registrada.
- Corpo: `# Nome`, `## Definição` (1–3 frases), relações como wikilinks
  tipados — `` - `tipo` → [[id-destino|Título]] `` — com frase legível,
  declaradas UMA vez, do lado da origem (backlink é derivado). Citar a
  fonte de cada afirmação.
- Divergência entre fontes → "Problemas ou questões abertas", nunca
  harmonizar silenciosamente.

## Passo 3 — validar

```bash
./notocorda check <pasta-do-vault>     # exit 1 = corrigir antes de encerrar
./notocorda focus <pasta-do-vault> <id-novo>
```

Nunca editar `generated/`, `graph.json` ou `graph.yaml` (derivados). Pessoas
não viram caixas — papel ou área, sim; nome próprio, nunca (o mapa documenta
processo, não desempenho). Lote grande: `check` no fim + skill `revisar`.
