---
step: 12
name: "revisao"
type: "agent"
agent: "bruno-balizador"
execution: "inline"
outputFile: "squads/live-social-media/output/review-report.md"
on_reject: 4
---

# Step 12 — Revisão de Qualidade

**Agente:** Bruno Balizador (✅ Revisor de Qualidade)

## Contexto

Bruno avalia todo o conteúdo produzido no ciclo — Reels, carrossel, Stories, TikTok, landing page, criativo de anúncio e influencer digital — e emite veredictos estruturados com pontuação por critério. Nenhum conteúdo chega à Paula Postagem sem passar pelo crivo de Bruno.

## Instruções

Executar a task `review` conforme definida em `agents/bruno-balizador/tasks/review.md`.

Avaliar todos os arquivos de conteúdo presentes em `squads/live-social-media/output/{run_id}/`:
- `content-reels.md`
- `content-carousel.md`
- `content-stories.md`
- `content-tiktok.md`
- `landing-page-copy.md`
- `content-ad-creative.md`
- `content-influencer.md`

(Avaliar apenas os arquivos que foram efetivamente gerados neste ciclo — pular os ausentes sem bloquear a revisão.)

Usar os critérios de qualidade em: `pipeline/data/quality-criteria.md`

## Output Esperado

Arquivo `squads/live-social-media/output/review-report.md` com:

Para cada peça avaliada:
```
## [APROVADO/REPROVADO] — [Nome do formato]
- Hook Power: [X]/10 — [justificativa em 1 frase]
- ICP Fit: [X]/10 — [justificativa em 1 frase]
- Brand Voice: [X]/10 — [justificativa em 1 frase]
- CTA Clarity: [X]/10 — [justificativa em 1 frase]
- Funnel Stage Alignment: [X]/10 — [justificativa em 1 frase]
[Se REPROVADO] Ajuste necessário: [instrução específica]
```

Seguido de resumo consolidado:
```
## Resumo do Ciclo
- Aprovados: X/Y
- Reprovados: X/Y
- Média geral: X.X/10
- Padrão de falha recorrente (se houver): [observação]
```

## Veto Conditions

- VETO se alguma peça for aprovada com qualquer critério abaixo de 7/10
- VETO se alguma peça for aprovada com qualquer critério abaixo de 4/10 (independente da média)
- VETO se alguma reprovação não vier acompanhada de instrução específica de ajuste
- VETO se o resumo consolidado estiver ausente
- VETO se algum arquivo presente no ciclo for omitido da revisão

## Review Loop

Se uma peça for reprovada e o usuário solicitar reescrita, retornar ao step 4 (criação de conteúdo) passando o feedback de Bruno como input adicional para o agente criador responsável.
