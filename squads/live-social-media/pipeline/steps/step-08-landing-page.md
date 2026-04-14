---
step: 8
name: "landing-page"
type: "agent"
agent: "fabio-funil"
execution: "inline"
inputFile: "squads/live-social-media/output/research-results.md"
outputFile: "squads/live-social-media/output/landing-page-copy.md"
model_tier: "powerful"
---

# Step 8 — Criação de Landing Page

**Agente:** Fábio Funil (🚀 Criador de Landing Pages)

## Contexto

Fábio recebe os ângulos de mercado e contexto da empresa para criar o copy completo de uma landing page de captura de leads — donos de estúdio que querem conhecer mais sobre a solução Live Universe.

## Instruções

Executar a task `create-landing-page` conforme definida em `agents/fabio-funil/tasks/create-landing-page.md`.

O input primário é: `squads/live-social-media/output/research-results.md`
Leia também: `_opensquad/_memory/company.md` (contexto completo da Live Universe)

A landing page deve ser para geração de leads (não para e-commerce). O CTA primário é "Solicitar visita ao showroom" ou "Falar com um consultor Live".

## Output Esperado

Arquivo `squads/live-social-media/output/landing-page-copy.md` com copy completo das 8 seções:
1. **Hero** — headline orientada a resultado de negócio + subtítulo + CTA primário
2. **Agitação** — problema específico com dor escalada (não genérica)
3. **Produto como sistema** — o Reformer V12 / sistema Live como solução estrutural
4. **Prova Social** — mínimo 2 depoimentos de donos de estúdio (reais ou modelos)
5. **Diferenciais Técnicos** — patente V12, biomecânica padronizada, treinamento de equipe
6. **CTA Secundário** — captura de lead alternativa (catálogo, webinar)
7. **FAQ** — mínimo 3 objeções de preço/durabilidade/assistência respondidas com dados
8. **CTA Final** — repetição do CTA primário com urgência leve e real

Incluir notas de design para cada bloco.

## Veto Conditions

- VETO se a headline do Hero falar do produto ou da empresa em vez do resultado de negócio
- VETO se não houver mínimo de 2 depoimentos de donos de estúdio na seção de prova social
- VETO se o FAQ não tiver pelo menos 3 objeções respondidas
- VETO se houver CTA com texto "Compre agora" ou equivalente agressivo
- VETO se a página não tiver pelo menos 3 CTAs distribuídos (hero, meio, final)
- VETO se alguma seção estiver incompleta ou marcada como "a completar"
