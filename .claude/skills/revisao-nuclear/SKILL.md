---
name: revisao-nuclear
description: Executar a Revisão Nuclear de um mapa Notocorda (Guia §17) — auditoria sistêmica completa da vault, do grafo, dos cenários, da cobertura, das contradições e dos riscos de ótimo local, com saída nos 9 artefatos canônicos. Use quando pedirem uma revisão nuclear, uma auditoria completa do mapa, ou antes de uma decisão estrutural.
---

# Revisão Nuclear

A auditoria sistêmica do Guia §17 (`docs/guia-grafo-em-camadas.md`) —
deliberadamente ampla: revisa o organismo, não um documento. A skill
`lacunas` é o termômetro; `revisar` é a biópsia de um lote; esta orquestra
tudo. É trabalho de sessão inteira — avisar o custo antes.

## Execução (os 20 passos do §17.2, por executor)

**Mecânico** (lentes CLI, primeiro): 1–2 compilar/validar (`./notocorda
check <vault>`, erros = parar e corrigir) + `resumo`; 7 órfãos
(`orphan-node` + `impacto --reverso`); 8 cobertura (lacunas do check);
10–13 problemas sem evidência / evidências órfãs / sistemas sem finalidade
/ dados sem significado (detectores da skill `lacunas`); 16 ciclos de
`requires`/`uses` fora do loop legítimo do eixo; 17 documentos vencidos
(`review.review_due_at`, `recorded_at` antigo em `hypothesis`).

**Julgamento** (agentes independentes, adversariais, um por tema —
instruídos a REFUTAR): 3–4 percorrer a espinha vértebra a vértebra, com as
realizações em todos os cenários; 5 + §17.3 **falsos essenciais** (as 7
perguntas: continua necessário se o sistema/área mudar? se centralizar? se
automatizar? em cenários alternativos? é necessidade ou prática atual? tem
evidência?); 6 capacidades duplicadas; 9 vazamento entre cenários; 14
contradições entre documentos (delegável à skill `revisar`); 15
responsabilidades conflitantes entre áreas; 18 + §17.4 **ótimo local** para
cada mudança proposta (o que melhora localmente × piora globalmente, quem
absorve custo, invariantes ameaçados, dependências novas, problema
deslocado, métricas de proteção, rollback); 19 mudanças × invariantes
(`./notocorda impacto`).

## Saída (§17.5)

`<vault>/nuclear-review/`: `executive-summary.md` (1 página),
`critical-findings.md`, `false-invariants.md`, `coverage-gaps.md`,
`contradictions.md`, `scenario-leakage.md`, `local-optimum-risks.md`,
`stale-documents.md`, `proposed-patches/` e `nuclear-review.json`. Seção
vazia também se escreve ("nada encontrado") — silêncio e "não verificado"
não podem se confundir.

## Regra de alteração (§17.6)

Sugere e gera patches; **nunca altera o conhecimento canônico
silenciosamente** — patches ficam em `proposed-patches/` e quem aplica é uma
sessão de escrita com aprovação. Cada patch explica o porquê, aponta o
afetado e registra incerteza. Mudança em elemento essencial (espinha) vai
para a governança do mapa.
