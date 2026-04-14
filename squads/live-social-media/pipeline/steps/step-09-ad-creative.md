---
step: 9
name: "ad-creative"
type: "agent"
agent: "amanda-anuncio"
execution: "subagent"
inputFile: "squads/live-social-media/output/research-results.md"
outputFile: "squads/live-social-media/output/content-ad-creative.md"
model_tier: "powerful"
---

# Step 9 — Criação de Criativo de Anúncio

**Agente:** Amanda Anúncio (📢 Criadora de Criativos)

## Contexto

Amanda recebe os ângulos de mercado pesquisados por Henrique e cria criativos completos para tráfego pago — Meta Ads (Instagram/Facebook) e TikTok Ads. Cada criativo usa um framework claro (PAS, BAB ou Social Proof) e tem copy, direção visual e notas de targeting.

## Instruções

Executar a task `create-ad-creative` conforme definida em `agents/amanda-anuncio/tasks/create-ad-creative.md`.

O input é: `squads/live-social-media/output/research-results.md`

Criar ao menos 2 variações de criativo:
- Variação A: framework PAS ou BAB (antes/depois, problema/agitação/solução)
- Variação B: Social Proof (resultado de cliente real ou representativo)

## Output Esperado

Arquivo `squads/live-social-media/output/content-ad-creative.md` com:
- Por variação: thumbnail description, body copy completo, CTA específico e ativo
- Framework identificado (PAS / BAB / Social Proof)
- Notas de targeting: público, objetivo de campanha, orçamento mínimo
- Variações A/B para teste de hook
- Especificação de formato (feed 1:1, stories 9:16, reels 9:16)
- Prompt de imagem para image-ai-generator (se criativo estático)

## Veto Conditions

- VETO se o hook não aparecer nos primeiros 5 palavras do body copy ou nos primeiros 3 segundos do vídeo
- VETO se o framework não estiver identificado e aplicado consistentemente
- VETO se o CTA for genérico ("saiba mais", "clique aqui") — deve ser específico e ativo
- VETO se não houver notas de targeting com público e objetivo de campanha
- VETO se o copy falar de feature de produto sem traduzir em resultado de negócio para o dono de estúdio
