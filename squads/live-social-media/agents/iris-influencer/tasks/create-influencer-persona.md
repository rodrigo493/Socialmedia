---
id: "squads/live-social-media/agents/iris-influencer/tasks/create-influencer-persona"
name: "Definir Persona de Influenciadora Digital"
agent: "iris-influencer"
---

# Task: Definir Persona de Influenciadora Digital

## Objetivo
Criar a identidade completa de uma influenciadora digital para a Live Universe: nome, aparência física detalhada, personalidade, propósito estratégico e diretrizes de uso por plataforma. Esta é a Task 1 do workflow Iris Influencer — nenhum prompt de imagem é gerado aqui.

## Inputs Necessários
- Objetivo da persona: qual produto ou campanha ela vai protagonizar
- Plataforma principal: Instagram, TikTok ou ambas
- Qualquer preferência de aparência do usuário (etnia, faixa etária, estilo)
- `_opensquad/_memory/company.md` — contexto Live Universe e ICP

## Processo de Criação

### Passo 1 — Definir o propósito estratégico
Antes de escolher qualquer característica de aparência, responder:
- Para qual ICP esta persona fala? (dono de estúdio 30–50 anos / professora de Pilates / gestora de academia)
- Em qual estágio do funil ela vai atuar? (awareness / consideração / conversão)
- Qual produto Live Universe ela vai representar?
- Qual é o diferencial de personalidade dela em relação a influenciadoras reais do mercado?

### Passo 2 — Definir identidade visual
Documentar com precisão para garantir consistência nos prompts:

**Dados obrigatórios:**
- Nome completo da persona
- Idade aparente (não um range — um número específico)
- Etnia e tom de pele (específico: ex. "parda com tom médio quente", não "morena")
- Formato do rosto (oval, quadrado, coração, redondo)
- Cabelo: cor, comprimento, textura, estilo (liso, ondulado, cacheado, crespo)
- Olhos: cor, formato
- Biótipo: altura estimada, build corporal (atlética, média, curvilínea)
- Estilo de vestuário padrão para o contexto Live Universe

**Justificativa obrigatória para cada escolha:**
> "Etnia escolhida: parda — representa a maioria das donas de estúdio boutique no Brasil, cria identificação imediata com o ICP feminino do mercado de Pilates."

### Passo 3 — Definir personalidade e voz
- 3 traços de personalidade principais (ex: confiante, direta, acolhedora)
- Como ela se comunica: tom, ritmo, vocabulário preferencial
- O que ela nunca diria (anti-padrões de voz)
- Uma frase de assinatura que define seu posicionamento

### Passo 4 — Definir diretrizes de uso
- Tipos de conteúdo que ela protagoniza: vídeo explicativo / depoimento / demonstração de produto / antes-e-depois
- Plataformas e formatos: TikTok 15–60s / Reels / Stories / Anúncio Meta
- O que ela nunca faz: atividades, poses, contextos fora do seu propósito de marca

### Passo 5 — Nomear os arquivos de referência
Definir os nomes dos 4 arquivos de imagem que serão gerados na Task 2:
- `[nome-persona]-frente.png`
- `[nome-persona]-costas.png`
- `[nome-persona]-direita.png`
- `[nome-persona]-esquerda.png`

## Template de Entrega

```
PERSONA DIGITAL — [NOME] — [DATA]

--- PROPÓSITO ---
ICP alvo: ...
Estágio de funil: ...
Produto Live Universe: ...
Diferencial de personalidade: ...

--- IDENTIDADE VISUAL ---
Nome: ...
Idade aparente: ...
Etnia/tom de pele: ... [justificativa: ...]
Formato do rosto: ...
Cabelo: cor [...], comprimento [...], textura [...], estilo [...]
Olhos: cor [...], formato [...]
Biótipo: ...
Vestuário padrão: ...

--- PERSONALIDADE ---
Traços: 1. [...] 2. [...] 3. [...]
Tom de voz: ...
Vocabulário: usa [...] / nunca usa [...]
Frase de assinatura: "..."

--- DIRETRIZES DE USO ---
Conteúdos que protagoniza: ...
Plataformas: ...
Nunca faz: ...

--- ARQUIVOS DE REFERÊNCIA ---
frente: [nome-persona]-frente.png
costas: [nome-persona]-costas.png
direita: [nome-persona]-direita.png
esquerda: [nome-persona]-esquerda.png
```

## Critérios de Conclusão
- [ ] Propósito estratégico documentado com ICP, funil e produto
- [ ] Identidade visual completa com justificativa para etnia e biótipo
- [ ] Personalidade com 3 traços, vocabulário e frase de assinatura
- [ ] Diretrizes de uso com tipos de conteúdo e plataformas definidos
- [ ] Nomes dos 4 arquivos de imagem definidos para a Task 2

## Output
Arquivo: `squads/live-social-media/output/influencer-persona.md`
Próximo passo: executar Task 2 — `generate-character-sheet.md`
