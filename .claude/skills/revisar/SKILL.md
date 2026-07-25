---
name: revisar
description: Review adversarial de documentos de um mapa Notocorda antes de consolidar — confere cada caixa e relação contra a fonte citada, o contrato e a honestidade das confidences. Use quando o usuário pedir para revisar caixas ou um lote de documentação do mapa, ou antes de promover status/confidence.
---

# Revisar

Um revisor INDEPENDENTE tenta derrubar o que foi escrito. O objetivo não é
aprovar — é falhar em encontrar erro. Quem revisa não herda a leitura de quem
escreveu: delegar a releitura das fontes a agentes independentes (só leitura)
instruídos a REFUTAR — "prove que este documento afirma algo que a fonte não
sustenta".

## Ordem

1. Camadas mecânicas primeiro (não gastar julgamento no que a máquina pega):
   `./notocorda check <vault>` e `./notocorda resumo <vault>`; anexar a
   skill `lacunas` quando o lote tocar cobertura.
2. Levantar as fontes citadas nas caixas do lote — a fonte é o juiz.

## A régua, caixa a caixa

1. **Fidelidade à fonte**: a definição afirma algo que a fonte não diz?
   Extrapolação sem `hypothesis` é o erro mais grave.
2. **Confidence honesta**: `certified` exige literalidade citável;
   `validated` exige validação humana registrada. Na dúvida, rebaixar —
   rebaixar não ofende, inflar corrompe.
3. **Tipo certo**: reaplicar o teste da espinha (§9.1) do zero. Realização
   promovida a espinha (e o inverso) são os erros clássicos.
4. **Relações**: cada aresta existe na fonte? Endpoints conferem com
   `schemas/registries.yaml`? Frase legível presente? Declarada só na origem?
5. **Divergências registradas**: fontes que discordam têm a seção
   "Problemas ou questões abertas"? Harmonização silenciosa é defeito.
6. **Contrato residual**: o que o `check` não pega.

## Parecer

Achados classificados por gravidade: `erro-de-fonte`, `confidence-inflada`,
`tipo-errado`, `erro-de-contrato`, `divergencia-nao-registrada`, `estilo`.
Cada um: caixa, o que está escrito, o que a fonte diz (citação), correção
proposta. O revisor **não corrige silenciosamente** — devolve o parecer, ou
aplica com aprovação explícita; achado de fonte se corrige citando, nunca
inventando. Review aprovado é pré-requisito de promoção, não promoção: quem
promove status é a governança do mapa.
