---
step: 10
name: "influencer"
type: "agent"
agent: "iris-influencer"
execution: "inline"
outputFile: "squads/live-social-media/output/content-influencer.md"
model_tier: "powerful"
---

# Step 10 — Criação de Influencer Digital

**Agente:** Iris Influencer (🧬 Criadora de Personas Digitais)

## Contexto

Iris cria influencers digitais completos para a Live Universe — personas com rosto e corpo gerados em Nano Banana Pro, com character sheet de 4 ângulos para consistência visual, e roteiro de vídeo para geração em Google AI Studio (Veo 3).

## Instruções

Executar as 3 tasks em sequência conforme definidas em `agents/iris-influencer/tasks/`:

1. `create-influencer-persona.md` — define a persona completa
2. `generate-character-sheet.md` — gera os 4 prompts de ângulo para Nano Banana Pro
3. `create-video-script.md` — cria roteiro e prompt para Google AI Studio

O output de cada task alimenta a próxima. O output final integra os três.

Consultar `pipeline/data/influencer-prompts-library.md` para os prompts de geração de rosto, corpo e ângulos.

## Output Esperado

Arquivo `squads/live-social-media/output/content-influencer.md` com:

### SEÇÃO 1 — Persona
- Nome, idade, perfil (ex: ex-instrutora que virou dona de estúdio)
- Tom de voz e propósito no conteúdo Live
- Narrativa de credibilidade para usar nos vídeos

### SEÇÃO 2 — Character Sheet (4 ângulos)
- Prompt de rosto para Nano Banana Pro (reference shot)
- Prompt FRENTE — fundo neutro, plano médio, câmera ARRI Alexa 8k
- Prompt COSTAS — mesma pessoa, de costas, mesmo fundo
- Prompt LADO DIREITO — perfil direito, mesmo fundo
- Prompt LADO ESQUERDO — perfil esquerdo, mesmo fundo
- Nota de consistência (instruções para manter fisionomia idêntica entre ângulos)

### SEÇÃO 3 — Roteiro de Vídeo
- Roteiro completo com timing [0-3s] [3-15s] [15-20s]
- Script de fala com gancho Live integrado
- Prompt para Google AI Studio (Veo 3) baseado no character sheet

## Veto Conditions

- VETO se a persona não for claramente do ICP Live (dono/gestora de estúdio, não professora ou aluna)
- VETO se não houver os 4 prompts de ângulo completos e distintos (frente, costas, direita, esquerda)
- VETO se qualquer prompt de ângulo não incluir instrução de fidelidade fisionômica ("Não altere nada na fisionomia", "mantenha seus traços fielmente iguais")
- VETO se o roteiro de vídeo não tiver gancho Live integrado nos primeiros 5 segundos
- VETO se o prompt para Google AI Studio não referenciar o character sheet gerado
