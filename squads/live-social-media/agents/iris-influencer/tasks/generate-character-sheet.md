---
id: "squads/live-social-media/agents/iris-influencer/tasks/generate-character-sheet"
name: "Gerar Character Sheet — 4 Ângulos"
agent: "iris-influencer"
---

# Task: Gerar Character Sheet — 4 Ângulos

## Objetivo
Gerar os 4 prompts de imagem (frente, costas, lado direito, lado esquerdo) para criar o character sheet completo da persona digital. Estes prompts são baseados no template Fundo Neutro e são otimizados para Nano Banana Pro, Gemini ou Seedream 4.5. Após a geração, acionar o image-ai-generator com cada prompt.

## Inputs Necessários
- `squads/live-social-media/output/influencer-persona.md` — identidade visual completa da persona (Task 1 concluída)
- `squads/live-social-media/pipeline/data/influencer-prompts-library.md` — biblioteca de referências
- Modelo de IA para geração: Nano Banana Pro / Gemini / Seedream 4.5 (confirmar com usuário)

## Regra Fundamental
**Todo prompt de ângulo deve conter a instrução de fidelidade de traços.** Sem essa instrução, a IA vai derivar da aparência definida na persona. A instrução é obrigatória em cada um dos 4 prompts, sem exceção.

Instrução padrão de fidelidade:
> "Não altere nada na fisionomia da mulher, mantenha seus traços e rosto fielmente iguais, assim como seu biotipo corporal também."

## Processo de Criação

### Passo 1 — Ler a persona completa
Abrir `influencer-persona.md` e extrair:
- Etnia e tom de pele exato
- Formato do rosto e traços faciais
- Cabelo: cor, comprimento, textura, estilo
- Biótipo
- Vestuário padrão para o contexto Live Universe

### Passo 2 — Consultar a biblioteca de prompts
Abrir `influencer-prompts-library.md` e identificar:
- Referências de iluminação que se aplicam ao contexto da persona
- Qualificadores de estilo fotográfico (8k, ARRI Alexa, cinematografia) relevantes
- Qualquer prompt de categoria que complemente o fundo neutro

### Passo 3 — Gerar os 4 prompts de ângulo

**BASE TEMPLATE — FUNDO NEUTRO:**
Todos os prompts usam fundo cinza claro neutro como padrão de referência.

---

**PROMPT 1 — FRENTE**
```
[Descrição detalhada da mulher baseada na persona] está em pé, de frente, 
contra um fundo neutro, cinza claro, centralizada no enquadramento, 
onde ela apareça da cintura para cima, em plano médio, seus braços aparecem 
por completo na imagem, olhando fixamente para a camera, e sorrindo; 
Não altere nada na fisionomia da mulher, mantenha seus traços e rosto 
fielmente iguais, assim como seu biotipo corporal também; 
Fotografado com uma camera ARRI Alexa, cinematografia em 8k
```

*Substituir [Descrição detalhada] com os dados exatos da persona. Exemplo:*
> "Uma mulher parda de 34 anos, cabelo castanho escuro liso na altura dos ombros, olhos castanhos, biotipo atlético médio, vestindo top esportivo preto e calça de pilates cinza..."

---

**PROMPT 2 — LADO DIREITO**
```
Faça essa mulher virada de perfil para o lado direito, completamente de lado 
para a camera; Não altere nada na fisionomia da mulher, mantenha seus traços 
e rosto fielmente iguais; Não altere a cor do fundo também; 
Fotografado com uma camera ARRI Alexa, cinematografia em 8k
```

*Nota: este prompt é usado com a imagem de frente já gerada como referência (img2img). O modelo de IA recebe a imagem da frente + este prompt.*

---

**PROMPT 3 — LADO ESQUERDO**
```
Faça essa mulher virada de perfil para o lado esquerdo, completamente de lado 
para a camera; Não altere nada na fisionomia da mulher, mantenha seus traços 
e rosto fielmente iguais; Não altere a cor do fundo também; 
Fotografado com uma camera ARRI Alexa, cinematografia em 8k
```

---

**PROMPT 4 — COSTAS**
```
Faça essa mulher virada completamente de costas para a camera; 
Não altere nada na fisionomia da mulher, mantenha seus traços 
e rosto fielmente iguais; Não altere a cor do fundo também; 
Fotografado com uma camera ARRI Alexa, cinematografia em 8k
```

### Passo 4 — Instruções de geração

**Sequência obrigatória:**
1. Gerar FRENTE primeiro — esta é a imagem de referência master
2. Usar FRENTE como referência (img2img ou reference image) para gerar os demais ângulos
3. Verificar consistência de traços entre os 4 ângulos antes de prosseguir
4. Se houver deriva de aparência, regenerar o ângulo problemático com instrução de fidelidade reforçada

**Acionar image-ai-generator** com cada prompt em sequência.

### Passo 5 — Documentar o character sheet

Criar o documento com os 4 prompts finalizados e os caminhos dos arquivos gerados.

## Template de Entrega

```
CHARACTER SHEET — [NOME DA PERSONA] — [DATA]
Modelo de IA usado: [Nano Banana Pro / Gemini / Seedream 4.5]

--- PROMPT FRENTE ---
[prompt completo com descrição da persona]
Arquivo gerado: output/[nome-persona]-frente.png

--- PROMPT LADO DIREITO ---
[prompt completo]
Arquivo gerado: output/[nome-persona]-direita.png

--- PROMPT LADO ESQUERDO ---
[prompt completo]
Arquivo gerado: output/[nome-persona]-esquerda.png

--- PROMPT COSTAS ---
[prompt completo]
Arquivo gerado: output/[nome-persona]-costas.png

--- NOTAS DE CONSISTÊNCIA ---
[ ] Traços faciais consistentes nos 4 ângulos
[ ] Tom de pele idêntico nos 4 ângulos
[ ] Cabelo e vestuário idênticos nos 4 ângulos
[ ] Fundo neutro cinza claro em todos os ângulos
```

## Critérios de Conclusão
- [ ] 4 prompts gerados com instrução explícita de fidelidade de traços em cada um
- [ ] Prompt de FRENTE contém a descrição física completa da persona
- [ ] Prompts de ângulos secundários referenciam a imagem de frente como master
- [ ] image-ai-generator acionado para cada prompt na sequência correta
- [ ] Checklist de consistência visual verificado nos 4 arquivos gerados

## Output
Arquivo: `squads/live-social-media/output/character-sheet.md`
Imagens: `squads/live-social-media/output/[nome-persona]-frente.png` (e os outros 3 ângulos)
Próximo passo: executar Task 3 — `create-video-script.md`
