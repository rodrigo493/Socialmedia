---
step: 5
name: "carrossel"
type: "agent"
agent: "caio-carrossel"
execution: "subagent"
format: "instagram-feed"
inputFile: "squads/live-social-media/output/research-results.md"
outputFile: "squads/live-social-media/output/content-carousel.md"
model_tier: "powerful"
---

# Step 5 — Criação de Carrossel

**Agente:** Caio Carrossel (🃏 Criador de Feed/Carrossel)

## Contexto

Caio recebe os ângulos de conteúdo pesquisados por Henrique e cria um carrossel educativo B2B para Instagram Feed no formato dialógico — o padrão que gerou maior engajamento nos perfis investigados (@metalifepilates).

## Instruções

Executar a task `create-carousel` conforme definida em `agents/caio-carrossel/tasks/create-carousel.md`.

O input é: `squads/live-social-media/output/research-results.md`

Selecionar o ângulo mais adequado para carrossel educativo (preferência por ângulos que permitem estrutura problema→solução com dados, ou temas que geram dúvida e querem aprofundamento).

## Output Esperado

Arquivo `squads/live-social-media/output/content-carousel.md` com:
- 6 a 10 slides com estrutura completa por slide: headline + texto de suporte + cor de fundo + visual
- Slide de capa com headline forte (scroll-stop)
- Alternância de fundo claro/escuro entre slides
- Slide final com CTA explícito e palavra-chave em MAIÚSCULAS
- Caption completa com hook, corpo e CTA
- Hashtags (no primeiro comentário)
- Notas de design para implementação

## Veto Conditions

- VETO se o carrossel tiver menos de 6 ou mais de 12 slides
- VETO se qualquer slide tiver menos de 30 ou mais de 100 palavras
- VETO se não houver hierarquia headline + texto de suporte em todos os slides
- VETO se as cores de fundo não alternarem entre os slides
- VETO se o slide final não tiver CTA com palavra-chave em MAIÚSCULAS
- VETO se a caption não tiver hook nas primeiras 125 caracteres visíveis
- VETO se o conteúdo falar para praticante de Pilates em vez de dono de estúdio
