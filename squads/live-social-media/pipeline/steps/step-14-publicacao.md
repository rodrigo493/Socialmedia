---
step: 14
name: "publicacao"
type: "agent"
agent: "paula-postagem"
execution: "subagent"
inputFile: "squads/live-social-media/output/review-report.md"
outputFile: "squads/live-social-media/output/publish-log.md"
model_tier: "fast"
---

# Step 14 — Publicação

**Agente:** Paula Postagem (📱 Publicadora)

## Contexto

Paula publica o conteúdo aprovado nas plataformas da Live Universe — Instagram e TikTok — via Blotato. Ela executa apenas após confirmação explícita do checkpoint de aprovação final (step 13). Cada publicação é documentada com URL, plataforma e timestamp.

## Instruções

Executar a task `publish` conforme definida em `agents/paula-postagem/tasks/publish.md`.

**PRÉ-REQUISITO OBRIGATÓRIO:** Confirmar que o checkpoint de aprovação final (step 13) foi concluído e documentado antes de qualquer ação de publicação.

O input é: `squads/live-social-media/output/review-report.md` (lista de peças APROVADAS)

Publicar apenas as peças com veredicto APROVADO, na ordem estratégica:
1. Topo de funil primeiro (awareness: Reels, Stories, TikTok)
2. Meio de funil depois (consideração: Carrossel, Landing Page)
3. Fundo de funil por último (decisão: Ad Creative)
4. Influencer digital: coordenar com timing de campanha

## Mapeamento de Formato → Plataforma

| Formato | Plataforma(s) |
|---------|--------------|
| Reels (content-reels.md) | Instagram Reels + TikTok |
| Carrossel (content-carousel.md) | Instagram Feed |
| Stories (content-stories.md) | Instagram Stories |
| TikTok (content-tiktok.md) | TikTok |
| Ad Creative (content-ad-creative.md) | Meta Ads + TikTok Ads (via configuração de campanha) |
| Landing Page (landing-page-copy.md) | Não publicar via Blotato — entregar à equipe de web |
| Influencer (content-influencer.md) | Não publicar via Blotato — entregar à equipe de geração de imagem |

## Output Esperado

Arquivo `squads/live-social-media/output/publish-log.md` com:
- Uma linha por post publicado: `[Formato] — publicado em [Plataforma] — [URL] — [timestamp]`
- Registro de qualquer erro de Blotato com descrição
- Resumo final: total publicado, plataformas utilizadas

## Veto Conditions

- VETO se tentar publicar sem confirmação explícita do checkpoint step 13
- VETO se tentar publicar peça com veredicto REPROVADO no review-report.md
- VETO se publicar em plataforma errada para o formato (ex: carrossel no TikTok)
- VETO se o publish-log.md não registrar URL e timestamp para cada post
- VETO se continuar após erro de Blotato sem documentar e alertar
