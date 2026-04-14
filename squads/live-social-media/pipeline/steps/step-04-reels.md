---
step: 4
name: "reels"
type: "agent"
agent: "giovana-gancho"
execution: "subagent"
format: "instagram-reels"
inputFile: "squads/live-social-media/output/research-results.md"
outputFile: "squads/live-social-media/output/content-reels.md"
model_tier: "powerful"
---

# Step 4 — Criação de Reels

**Agente:** Giovana Gancho (🎬 Criadora de Reels)

## Contexto

Giovana recebe os ângulos de conteúdo pesquisados por Henrique e cria um roteiro completo de Reel para Instagram — estruturado para parar o scroll nos primeiros 3 segundos e entregar valor antes do CTA.

## Instruções

Executar a task `create-reel` conforme definida em `agents/giovana-gancho/tasks/create-reel.md`.

O input é: `squads/live-social-media/output/research-results.md`

Selecionar o ângulo mais adequado para formato Reel (preferência por ângulos de topo/meio de funil com alta tensão ou dado surpreendente).

## Output Esperado

Arquivo `squads/live-social-media/output/content-reels.md` com:
- Roteiro estruturado: HOOK (0-3s) → SETUP (3-10s) → DELIVERY (10-45s) → CTA (45-60s)
- Script completo de fala
- Text overlays para cada seção
- Direção visual (visuais sugeridos por seção)
- Caption completa (hook visível + corpo + CTA)
- Hashtags (no primeiro comentário)
- Nota de áudio
- Proporção 9:16 especificada

## Veto Conditions

- VETO se o hook dos primeiros 3 segundos não tiver pergunta, dado ou afirmação polarizante
- VETO se a duração total ultrapassar 90 segundos
- VETO se não houver CTA específico com palavra-chave em MAIÚSCULAS
- VETO se a proporção 9:16 não estiver especificada
- VETO se o script falar para praticante de Pilates em vez de dono de estúdio
- VETO se a caption não tiver hook nas primeiras 125 caracteres visíveis
