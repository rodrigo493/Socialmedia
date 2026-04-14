---
step: 6
name: "stories"
type: "agent"
agent: "elisa-efemera"
execution: "subagent"
format: "instagram-stories"
inputFile: "squads/live-social-media/output/research-results.md"
outputFile: "squads/live-social-media/output/content-stories.md"
model_tier: "powerful"
---

# Step 6 — Criação de Stories

**Agente:** Elisa Efêmera (✨ Criadora de Stories)

## Contexto

Elisa recebe os ângulos de conteúdo pesquisados por Henrique e cria uma sequência de Stories com 3 a 7 frames — formato efêmero que maximiza engajamento via elementos interativos (polls, quiz) e gera tráfego qualificado.

## Instruções

Executar a task `create-stories` conforme definida em `agents/elisa-efemera/tasks/create-stories.md`.

O input é: `squads/live-social-media/output/research-results.md`

Selecionar o ângulo mais adequado para Stories (preferência por temas que permitem narrativa rápida, cobertura de evento, bastidores, ou perguntas interativas para o ICP).

## Output Esperado

Arquivo `squads/live-social-media/output/content-stories.md` com:
- Sequência de 3 a 7 frames com especificação completa por frame
- Por frame: visual sugerido, text overlay (máximo 3 linhas), elementos interativos (se aplicável), música/sticker
- Mínimo 1 elemento interativo na sequência (poll ou quiz)
- Frame final com CTA claro (link sticker ou CTA de resposta)
- Notas de tempo estimado por frame (3-5 segundos)
- Objetivo primário da sequência (engajamento / tráfego / awareness)

## Veto Conditions

- VETO se a sequência tiver menos de 3 frames
- VETO se não houver nenhum elemento interativo (poll ou quiz)
- VETO se qualquer frame tiver mais de 4 linhas de texto
- VETO se o tom não for conversacional e casual
- VETO se não houver frame final com CTA ou call para ação clara
