---
step: 7
name: "tiktok"
type: "agent"
agent: "davi-destaque"
execution: "subagent"
inputFile: "squads/live-social-media/output/research-results.md"
outputFile: "squads/live-social-media/output/content-tiktok.md"
model_tier: "powerful"
---

# Step 7 — Criação de Roteiro TikTok

**Agente:** Davi Destaque (🎵 Criador de TikTok)

## Contexto

Davi recebe os ângulos de conteúdo pesquisados por Henrique e cria um roteiro nativo para TikTok — linguagem falada, ritmo acelerado, sem parecer conteúdo B2B corporativo. O dono de estúdio no TikTok está em modo de consumo, não de trabalho.

## Instruções

Executar a task `create-tiktok` conforme definida em `agents/davi-destaque/tasks/create-tiktok.md`.

O input é: `squads/live-social-media/output/research-results.md`

Selecionar o ângulo com mais tensão e potencial de afirmação polarizante — TikTok exige posição forte desde o primeiro segundo. Ângulos com dado surpreendente ou comparação inesperada têm melhor performance.

## Output Esperado

Arquivo `squads/live-social-media/output/content-tiktok.md` com:
- Roteiro com timing marcado por segundo [00:00] [00:05] etc.
- Duração entre 15 e 60 segundos
- Hook nos primeiros 3 segundos (afirmação polarizante, pergunta ou revelação)
- Text overlay separado da fala (máximo 5 palavras por frame de overlay)
- Script de fala em linguagem falada e natural
- Sugestão de categoria de áudio (trending, original, silêncio dramático)
- CTA natural após entrega de valor (nunca antes)

## Veto Conditions

- VETO se o hook não aparecer nos primeiros 3 segundos do roteiro
- VETO se o roteiro ultrapassar 60 segundos de duração
- VETO se o text overlay não estiver definido separado da fala
- VETO se o roteiro soar formal ou corporativo quando lido em voz alta
- VETO se o CTA aparecer antes da entrega principal de valor
- VETO se não houver sugestão de categoria de áudio
