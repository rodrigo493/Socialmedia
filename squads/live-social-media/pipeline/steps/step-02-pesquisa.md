---
step: 2
name: "pesquisa"
type: "agent"
agent: "henrique-horizonte"
execution: "subagent"
inputFile: "squads/live-social-media/output/research-focus.md"
outputFile: "squads/live-social-media/output/research-results.md"
model_tier: "powerful"
---

# Step 2 — Pesquisa Estratégica

**Agente:** Henrique Horizonte (🔭 Pesquisador Estratégico)

## Contexto

Henrique recebe o foco da semana definido pelo usuário e executa pesquisa profunda do mercado fitness B2B brasileiro para identificar ângulos de conteúdo de alto impacto para a Live Universe.

## Instruções

Executar a task `research-trends` conforme definida em `agents/henrique-horizonte/tasks/research-trends.md`.

O foco da semana está em: `squads/live-social-media/output/research-focus.md`

## Output Esperado

Arquivo `squads/live-social-media/output/research-results.md` com:
- Movimentos dos concorrentes da semana (@metalifepilates, @equipilates_oficial, @rafael.voll, @technogym_brazil)
- Dados de mercado relevantes com âncoras numéricas
- Mínimo 3 ângulos de conteúdo no template completo (tema + ponto de vista + funil + âncora + formato + CTA + urgência)
- Observações estratégicas para o ciclo de produção

## Veto Conditions

- VETO se o relatório tiver menos de 3 ângulos completos documentados
- VETO se algum ângulo não especificar o estágio de funil (topo/meio/fundo)
- VETO se nenhum dado numérico ou referência de mercado foi incluído
- VETO se o conteúdo é focado em B2C (praticantes de Pilates) em vez de B2B (donos de estúdio)
