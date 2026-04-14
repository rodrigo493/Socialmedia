---
id: "squads/live-social-media/agents/bruno-balizador/tasks/review"
name: "Revisar Conteúdo do Ciclo"
agent: "bruno-balizador"
---

# Task: Revisar Conteúdo do Ciclo

## Objetivo
Avaliar todo o conteúdo produzido no ciclo semanal e emitir veredictos estruturados (APROVADO/REPROVADO) com pontuações por critério, garantindo que apenas conteúdo de qualidade chegue à publicação.

## Inputs Necessários
- Todos os arquivos de conteúdo em `squads/live-social-media/output/` com extensão `.md` gerados no ciclo atual
- `squads/live-social-media/output/research-results.md` — para verificar alinhamento com ângulos pesquisados

## Critérios de Avaliação

Cada peça de conteúdo é avaliada em 5 critérios, nota de 1 a 10:

### 1. Hook Power (Poder do Gancho)
Avalia os primeiros 3 segundos (vídeo) ou primeira linha/imagem (carrossel/stories).
- **9-10**: Hook impossível de ignorar, cria tensão imediata ou curiosidade irresistível
- **7-8**: Hook claro e relevante, gera interesse sem ser genérico
- **5-6**: Hook presente mas previsível, não diferencia do concorrente
- **1-4**: Hook fraco, genérico ou inexistente — **REPROVAÇÃO AUTOMÁTICA se ≤4**

### 2. ICP Fit (Adequação ao ICP)
Avalia se o conteúdo fala diretamente para o dono de estúdio/academia de Pilates (B2B), 30-50 anos, pragmático.
- **9-10**: Todo o conteúdo fala exclusivamente para o dono de estúdio, com dor/aspiração específica do segmento
- **7-8**: Conteúdo claramente B2B, pode ter um elemento genérico mas o foco está correto
- **5-6**: Misto entre B2B e B2C, pode confundir o ICP
- **1-4**: Conteúdo fala para praticante de Pilates (B2C) ou público genérico — **REPROVAÇÃO AUTOMÁTICA se ≤4**

### 3. Brand Voice (Voz da Marca)
Avalia alinhamento com o tom da Live Universe: direto, estratégico, provocador com autoridade, sem hype.
- **9-10**: Voz autêntica da Live Universe, tom perfeito para o ICP, sem jargão vazio
- **7-8**: Tom adequado, pequenos desvios que não comprometem a percepção de marca
- **5-6**: Tom inconsistente, ora muito formal ora muito coloquial
- **1-4**: Tom completamente fora da marca (muito hype, muito corporativo, muito B2C) — **REPROVAÇÃO AUTOMÁTICA se ≤4**

### 4. CTA Clarity (Clareza do CTA)
Avalia se a chamada à ação é clara, específica e alinhada com o estágio de funil.
- **9-10**: CTA específico, acionável, com palavra-chave ou instrução clara (ex: "COMENTE REFORMER", "Link na bio", "Fale com nosso time")
- **7-8**: CTA presente e claro, pode ser ligeiramente genérico
- **5-6**: CTA vago ou mal posicionado no conteúdo
- **1-4**: Sem CTA ou CTA incompatível com o estágio de funil — **REPROVAÇÃO AUTOMÁTICA se ≤4**

### 5. Funnel Stage Alignment (Alinhamento com Estágio de Funil)
Avalia se o conteúdo está correto para seu estágio declarado (topo/meio/fundo).
- **9-10**: Conteúdo perfeito para o estágio, com profundidade e objetivo corretos
- **7-8**: Conteúdo adequado ao estágio, pequenos elementos fora de contexto
- **5-6**: Conteúdo mistura estágios sem intenção clara
- **1-4**: Conteúdo errado para o estágio (ex: CTA de compra em conteúdo de awareness) — **REPROVAÇÃO AUTOMÁTICA se ≤4**

## Processo de Revisão

### Passo 1 — Listar arquivos do ciclo
Identificar todos os arquivos `.md` em `squads/live-social-media/output/` que representam conteúdo criado (excluir research-results.md e review-report.md).

### Passo 2 — Avaliar cada peça
Para cada arquivo, emitir o bloco de avaliação:

```
## [NOME DO ARQUIVO]
**Tipo**: [Reels / Carrossel / Stories / TikTok / Landing Page / Ad Creative / Influencer]
**Estágio de Funil**: [topo / meio / fundo]

| Critério | Nota | Justificativa |
|---|---|---|
| Hook Power | X/10 | [1-2 frases] |
| ICP Fit | X/10 | [1-2 frases] |
| Brand Voice | X/10 | [1-2 frases] |
| CTA Clarity | X/10 | [1-2 frases] |
| Funnel Alignment | X/10 | [1-2 frases] |

**Média**: X/10
**Veredicto**: APROVADO / REPROVADO

[Se REPROVADO] **Ajustes Necessários**:
- [critério que falhou]: [o que mudar especificamente]
```

### Passo 3 — Gerar resumo consolidado
Após avaliar todas as peças, emitir:

```
## Resumo do Ciclo
- Total de peças avaliadas: N
- Aprovadas: N
- Reprovadas: N
- Média geral do ciclo: X/10
- Critério mais fraco do ciclo: [nome]
- Padrões de falha identificados: [lista ou "nenhum"]
```

## Critérios de Conclusão
- [ ] Todos os arquivos de conteúdo avaliados individualmente
- [ ] Nenhum arquivo de conteúdo omitido da revisão
- [ ] review-report.md gerado com todos os blocos de avaliação e resumo consolidado
- [ ] Peças aprovadas listadas explicitamente para a Paula Postagem

## Output
Arquivo: `squads/live-social-media/output/review-report.md`
