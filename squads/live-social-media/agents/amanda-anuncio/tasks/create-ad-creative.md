---
id: "squads/live-social-media/agents/amanda-anuncio/tasks/create-ad-creative"
name: "Criar Criativo de Anúncio"
agent: "amanda-anuncio"
---

# Task: Criar Criativo de Anúncio

## Objetivo
Produzir um conjunto completo de criativos para tráfego pago (Meta Ads e/ou TikTok Ads), incluindo direção visual, copy, CTA, segmentação, variações A/B e prompt de imagem para geração com IA.

## Inputs Necessários
- Plataforma alvo: Meta Ads / TikTok Ads / ambas
- Objetivo de campanha: awareness / consideração / conversão / retargeting
- Produto em destaque (Reformer V12, Chair, Cadillac, Sistema Live completo)
- `squads/live-social-media/output/research-results.md` — dores e ângulos da semana
- `_opensquad/_memory/company.md` — diferenciais e dados Live Universe

## Processo de Criação

### Passo 1 — Selecionar framework
Escolher o framework baseado no objetivo de campanha:

| Objetivo | Framework Recomendado |
|---|---|
| Awareness / topo de funil | BAB (Before-After-Bridge) |
| Consideração / meio de funil | PAS (Pain-Agitation-Solution) |
| Conversão / fundo de funil | Prova Social estruturada |
| Retargeting | PAS com urgência leve |

Documentar a escolha antes de escrever qualquer linha.

### Passo 2 — Escrever o copy

**Framework PAS — Pain-Agitation-Solution (B2B Studio Owner)**
```
PAIN: Identifica a dor específica em 1 frase curta
→ "Aparelho parado é agenda cancelada."

AGITATION: Escala a consequência financeira ou emocional
→ "Cada hora parada são R$ 80–150 de receita que o seu estúdio não vai recuperar.
   E pior: o aluno que perdeu a aula pode não voltar."

SOLUTION: Posiciona o produto como saída lógica
→ "O Reformer V12 da Live Universe é construído para uso intensivo.
   Estrutura para 10h/dia. Manutenção evitada. Agenda protegida."

CTA: Convite específico, não imperativo
→ "Conheça o sistema Live → Solicitar visita"
```

**Framework BAB — Before-After-Bridge (Transformação do Estúdio)**
```
BEFORE: Estado atual frustrante
→ "Você abriu o estúdio para dar aulas. Mas passa mais tempo resolvendo problema de aparelho do que crescendo o negócio."

AFTER: Estado desejado e específico
→ "Com o Sistema Live: agenda cheia, aparelho confiável, faturamento previsível."

BRIDGE: Como chegar lá
→ "O Reformer V12 é o aparelho que donos de estúdio escolhem quando decidiram parar de improvisar e começar a escalar."

CTA: → "Falar com consultor Live"
```

**Framework Prova Social Estruturada**
```
RESULTADO: Número ou resultado real de cliente
→ "+40% de ocupação em 60 dias"

CONTEXTO: Quem obteve e como
→ Fernanda R., Studio FR (São Paulo) — depois de trocar os aparelhos pelo Sistema Live

MECANISMO: Por que funcionou
→ "Agenda que não quebra. Aparelho que não para. Aluno que não cancela."

CTA: → "Ver como funciona para o seu estúdio"
```

### Passo 3 — Definir direção visual da thumbnail

Para cada criativo, escrever descrição da thumbnail:
- Sujeito principal: aparelho Live em uso / dono de estúdio / comparativo visual
- Ambiente: estúdio real, iluminação profissional, sem stock photo
- Mood: confiança e resultado (não esforço físico)
- Texto na imagem: máximo 6 palavras em tipografia grande e contrastante
- Cor dominante: paleta Live (laranja + preto + branco) ou contraste alto

### Passo 4 — Gerar prompt de imagem para image-ai-generator

Template de prompt:
```
[Sujeito] em [ambiente], [composição de câmera], [iluminação], [mood/emoção].
Estilo: fotografia comercial B2B, qualidade editorial. [Instrução de texto na imagem se houver].
Não incluir: pessoas praticando pilates, ambiente genérico de academia.
Paleta: laranja (#F15A24), preto, branco.
```

*Exemplo completo:*
```
Dono de estúdio de pilates (homem 40 anos, terno casual) de braços cruzados na frente de um Reformer moderno em estúdio boutique iluminado, enquadramento 3/4 corpo, expressão confiante e satisfeita. Estilo: fotografia comercial B2B, qualidade editorial, luz natural lateral. Texto sobreposto em caixa alta: "SEU APARELHO NÃO PARA". Paleta: laranja (#F15A24), preto, branco.
```

### Passo 5 — Criar variações A/B

Regra: **uma variável por variação, hipótese documentada.**

**Variação A (controle):** [copy original]
**Variação B:** [mudar apenas o hook]
→ Hipótese: hook com número específico gera mais CTR que hook com pergunta

**Variação C:** [mudar apenas a thumbnail]
→ Hipótese: imagem com dono de estúdio converte melhor que imagem apenas do aparelho para cold audience

### Passo 6 — Notas de segmentação

Para cada criativo, especificar:
- **Audiência**: cold (interesses fitness B2B) / lookalike de clientes / retargeting de visitantes de site
- **Objetivo de campanha no Gerenciador**: Leads / Tráfego / Vendas / Alcance
- **Budget mínimo recomendado**: estimativa para o objetivo (ex: R$ 50/dia para geração de leads)
- **Posicionamento**: Feed / Stories / Reels / TikTok For You Page

## Template de Entrega

```
CRIATIVO [N] — [PLATAFORMA] — [FRAMEWORK]
Data: [data]
Produto: [produto]
Objetivo: [objetivo de campanha]
Audiência: [cold / warm / retargeting]

--- THUMBNAIL ---
Descrição visual: ...
Texto na imagem: "..."
Prompt para image-ai-generator: "..."

--- COPY ---
Hook: "..."
Corpo: "..."
CTA (texto do copy): "..."
CTA (botão): "..."

--- SEGMENTAÇÃO ---
Audiência: ...
Objetivo no gerenciador: ...
Budget mínimo: R$ .../dia
Posicionamento: ...

--- A/B VARIAÇÕES ---
Variação A (controle): [descrever]
Variação B: [descrever] → Hipótese: [...]
Variação C: [descrever] → Hipótese: [...]
```

## Critérios de Conclusão
- [ ] Framework escolhido e documentado antes do copy
- [ ] Copy completo com hook, corpo e CTA em cada variação
- [ ] Prompt de imagem para image-ai-generator com mínimo 40 palavras
- [ ] Mínimo 2 variações A/B com variável isolada e hipótese declarada
- [ ] Notas de segmentação: audiência, objetivo, budget mínimo e posicionamento

## Output
Arquivo: `squads/live-social-media/output/ad-creatives.md` (append com separador de data e campanha)
