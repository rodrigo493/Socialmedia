---
id: "squads/live-social-media/agents/iris-influencer/tasks/create-video-script"
name: "Criar Roteiro de Vídeo com Prompt para Veo 3"
agent: "iris-influencer"
---

# Task: Criar Roteiro de Vídeo com Prompt para Veo 3

## Objetivo
Criar o roteiro completo do vídeo protagonizado pela persona digital + o prompt técnico para geração no Google AI Studio (Veo 3). A entrega tem duas camadas separadas: direção visual e fala/narração.

## Inputs Necessários
- `squads/live-social-media/output/influencer-persona.md` — identidade e voz da persona (Task 1)
- `squads/live-social-media/output/character-sheet.md` — referência visual da persona (Task 2)
- Objetivo do vídeo: produto a destacar, mensagem principal, plataforma de publicação
- Duração alvo: 15s / 30s / 60s

## Regra Fundamental
O roteiro de vídeo para IA generativa **sempre tem duas camadas separadas e explícitas**:
1. **Camada Visual** — instrução para o modelo de vídeo: movimento de câmera, ambiente, ação da persona, iluminação
2. **Camada de Fala** — texto que a persona diz ou que aparece como narração/legenda

Nunca misturar as duas camadas num único bloco de texto.

## Processo de Criação

### Passo 1 — Definir a estrutura narrativa
Baseado na duração alvo, escolher a estrutura:

**15 segundos:** Hook (0–3s) → Ponto Central (3–12s) → CTA (12–15s)
**30 segundos:** Hook (0–3s) → Problema (3–10s) → Solução (10–25s) → CTA (25–30s)
**60 segundos:** Hook (0–3s) → Problema (3–15s) → Demonstração (15–40s) → Prova (40–55s) → CTA (55–60s)

### Passo 2 — Escrever o roteiro por cenas

Para cada cena, preencher o template de duas camadas:

```
CENA [N] — [00:00–00:00]

VISUAL:
[Descrição da persona em ação, ângulo de câmera, movimento, ambiente, iluminação]

FALA:
"[Texto exato que a persona diz ou que aparece como legenda/narração]"

DIREÇÃO ADICIONAL:
[Instrução de expressão facial, ritmo de fala, tom emocional]
```

**Exemplo de cena preenchida:**
```
CENA 1 — [00:00–00:03]

VISUAL:
Câmera em close-up no rosto de [Nome da Persona], ela olha diretamente para a câmera 
com expressão confiante. Fundo: estúdio de Pilates desfocado ao fundo, 
um Reformer Live visível. Iluminação: luz natural lateral suave.

FALA:
"Você sabia que aparelho parado é o maior inimigo do faturamento do seu estúdio?"

DIREÇÃO ADICIONAL:
Tom direto, sem sorrir, pausa de 0,5s após "aparelho parado" para impacto.
```

### Passo 3 — Gerar o prompt técnico para Veo 3

O prompt para Google AI Studio / Veo 3 segue esta estrutura:

```
PROMPT VEO 3 — [NOME DA PERSONA] — [TÍTULO DO VÍDEO]

Persona de referência: [arquivos do character sheet — incluir imagem de frente como referência]

Duração: [Xs]
Aspecto: [9:16 para mobile / 16:9 para horizontal]
Estilo visual: fotorrealista, qualidade cinematográfica, sem elementos de IA aparentes

DESCRIÇÃO GERAL DA CENA:
[Parágrafo único descrevendo o ambiente geral, a persona e o mood do vídeo]

SEQUÊNCIA DE CENAS:
Cena 1 [0–3s]: [descrição visual compacta]
Cena 2 [3–10s]: [descrição visual compacta]
[continuar para cada cena]

INSTRUÇÕES DE CONSISTÊNCIA:
- Manter aparência da persona idêntica à imagem de referência em todas as cenas
- Não alterar tom de pele, cabelo ou traços faciais
- Fundo do estúdio Pilates consistente ao longo do vídeo

ÁUDIO:
Fala da persona: [transcrição completa do que ela diz, em ordem]
Música de fundo: [instrução de mood — instrumental suave / sem música / trilha energética]
```

### Passo 4 — Adaptar fala para legenda/caption

Extrair a fala da persona e formatar como legenda pronta para adicionar no vídeo:
- Dividir em blocos de máximo 7 palavras por frame
- Indicar timing de cada bloco
- Sugerir estilo tipográfico (cor, tamanho, posição)

### Passo 5 — Entregar checklist de publicação

Após o roteiro e o prompt, incluir:
- Plataforma de publicação: TikTok / Instagram Reels / Meta Ads
- Hashtags sugeridas (3–5)
- Caption/legenda da publicação (separado do texto do vídeo)
- Horário de publicação recomendado (baseado em dados da plataforma)

## Template de Entrega Completo

```
ROTEIRO DE VÍDEO — [NOME DA PERSONA] — [TEMA] — [DATA]
Duração: [Xs] | Plataforma: [...] | Produto: [...]

---

ESTRUTURA NARRATIVA: [Hook → Problema → Solução → CTA]

---

CENA 1 — [00:00–00:03]
VISUAL: ...
FALA: "..."
DIREÇÃO: ...

CENA 2 — [00:03–00:XX]
VISUAL: ...
FALA: "..."
DIREÇÃO: ...

[continuar para todas as cenas]

---

PROMPT VEO 3:
[prompt técnico completo conforme Passo 3]

---

LEGENDA FORMATADA:
[00:00] "..."
[00:03] "..."
[continuar]

Estilo tipográfico: [cor, tamanho, posição]

---

PUBLICAÇÃO:
Plataforma: ...
Caption: "..."
Hashtags: #... #... #...
Horário sugerido: ...
```

## Critérios de Conclusão
- [ ] Roteiro com duas camadas separadas (visual e fala) em todas as cenas
- [ ] Timing marcado em segundos para cada cena
- [ ] Prompt Veo 3 completo com referência ao character sheet, instrução de consistência de persona e sequência de cenas
- [ ] Legenda formatada em blocos de máximo 7 palavras com timing
- [ ] Checklist de publicação completo: plataforma, caption, hashtags e horário

## Output
Arquivo: `squads/live-social-media/output/video-script.md`
Referência de imagem: `squads/live-social-media/output/[nome-persona]-frente.png` (usar como referência no Veo 3)
