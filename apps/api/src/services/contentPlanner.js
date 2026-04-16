// Gera plano semanal de conteudo com Claude Opus 4.6 a partir do contexto
// da marca (_opensquad/_memory/company.md) e da analise consolidada de
// concorrentes/perfil proprio (squads/.../_investigations/consolidated-analysis.md).
//
// Usa prompt caching no bloco de contexto (estavel entre chamadas) e structured
// output (JSON schema) pra garantir formato compativel com /api/v1/items.

import Anthropic from '@anthropic-ai/sdk'
import { loadBrandContext } from './context.js'
import * as productMatcher from './productMatcher.js'

const MODEL = 'claude-opus-4-6'

const SYSTEM_PROMPT = `Voce e um diretor de conteudo senior para uma marca brasileira de equipamentos premium de Pilates (Live Equipamentos).

Sua tarefa: gerar uma PAUTA semanal de conteudo para Instagram seguindo a estrategia da marca e aprendendo com a estetica/topicos dos concorrentes mapeados.

Regras de formato (OBRIGATORIO):
- Responda apenas com JSON valido seguindo o schema fornecido.
- Mix variado de formatos: carrosseis (educativo/posicionamento), reels (impacto/storytelling) e stories (bastidor/leveza).
- Headlines diretas, em portugues do Brasil, com tom da marca (sofisticado, direto, sem clickbait barato).
- Copys de carrossel: maximo 5 slides, cada slide com headline curta (max 60 chars) e subtexto (max 100 chars).
- Reels: voiceText curto (60-100 palavras), cinematografico, primeira frase ja prende.
- Stories: tema unificado, 4-6 frames.

Regras de conteudo (OBRIGATORIO):
- BASEIE-SE no contexto da marca e na analise de concorrentes que vai receber. NAO invente fatos genericos.
- Topicos devem refletir: dores reais do publico (donos de studio, fisios, atletas), posicionamento da Live Equipamentos, gaps que os concorrentes nao estao explorando.
- Evite clichês de Pilates ("transforme seu corpo", "vida saudavel"). Seja especifico.
- IMPORTANTE — PRODUTOS: voce vai receber a lista de produtos reais que a marca fabrica. Use os NOMES desses produtos nos titulos/captions/scripts quando fizer sentido — assim o sistema usa as fotos reais como referencia visual ao gerar imagem/video. Nao invente nomes de produtos que nao estao na lista.`

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      description: 'Lista de pecas a produzir nesse ciclo',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['carousel', 'reel', 'story'], description: 'Formato da peca' },
          agent: { type: 'string', enum: ['caio-carrossel', 'davi-destaque', 'elisa-efemera'], description: 'Agente responsavel: carousel->caio-carrossel, reel->davi-destaque, story->elisa-efemera' },
          title: { type: 'string', description: 'Titulo curto que resume a peca (max 80 chars)' },
          topic: { type: 'string', description: 'Para carrossel: tema/area (ex: pricing, gestao, equipamento). Vazio para outros tipos.' },
          caption: { type: 'string', description: 'Legenda do post para Instagram (max 300 chars). Sempre presente.' },
          voiceText: { type: 'string', description: 'Para reel: roteiro narrado em 60-100 palavras. Vazio para outros tipos.' },
          frames: { type: 'integer', description: 'Para story: numero de frames (4-6). Zero para outros tipos.' },
          slides: {
            type: 'array',
            description: 'Para carrossel: 3-5 slides. Vazio para outros tipos.',
            items: {
              type: 'object',
              properties: {
                idx: { type: 'integer', description: 'Posicao (1-N)' },
                headline: { type: 'string', description: 'Titulo do slide (max 60 chars)' },
                sub: { type: 'string', description: 'Subtexto (max 100 chars)' },
              },
              required: ['idx', 'headline', 'sub'],
              additionalProperties: false,
            },
          },
        },
        required: ['type', 'agent', 'title', 'topic', 'caption', 'voiceText', 'frames', 'slides'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
}

function buildContextBlock(ctx, products) {
  const parts = []
  if (ctx.company) parts.push(`### CONTEXTO DA MARCA (Live Equipamentos)\n\n${ctx.company}`)
  if (ctx.consolidated) parts.push(`### ANALISE DE CONCORRENTES E PERFIL PROPRIO\n\n${ctx.consolidated}`)
  if (products && products.length) {
    const lines = products.map(p => {
      const aliases = p.terms.filter(t => t.toLowerCase() !== p.name.toLowerCase()).slice(0, 5)
      return `- ${p.name}${aliases.length ? ` (tambem chamado: ${aliases.join(', ')})` : ''}`
    })
    parts.push(`### PRODUTOS DA MARCA (use esses nomes nos titulos/captions quando relevante)\n\n${lines.join('\n')}`)
  }
  return parts.join('\n\n---\n\n')
}

// Limpa item retornado pelo Claude — remove campos vazios para nao confundir items.js.
function cleanItem(it) {
  const out = { type: it.type, agent: it.agent, title: it.title, caption: it.caption }
  if (it.type === 'carousel' && Array.isArray(it.slides) && it.slides.length) {
    out.slides = it.slides
    if (it.topic) out.topic = it.topic
  }
  if (it.type === 'reel' && it.voiceText) out.voiceText = it.voiceText
  if (it.type === 'story' && it.frames > 0) out.frames = it.frames
  return out
}

export function isAvailable() {
  return !!process.env.ANTHROPIC_API_KEY
}

// Gera N itens. Retorna null se nao houver contexto util ou se a API falhar
// (chamador deve cair no DEFAULT_MIX).
export async function generatePlan({ count = 7, log } = {}) {
  if (!isAvailable()) {
    log?.warn('contentPlanner: ANTHROPIC_API_KEY ausente — fallback')
    return null
  }
  const ctx = await loadBrandContext()
  const products = await productMatcher.listAll()
  if (!ctx.hasAny && !products.length) {
    log?.warn('contentPlanner: sem contexto e sem produtos — fallback')
    return null
  }

  const client = new Anthropic()
  const contextBlock = buildContextBlock(ctx, products)

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: [
        { type: 'text', text: SYSTEM_PROMPT },
        { type: 'text', text: contextBlock, cache_control: { type: 'ephemeral' } },
      ],
      output_config: {
        format: { type: 'json_schema', schema: PLAN_SCHEMA },
      },
      messages: [{
        role: 'user',
        content: `Gere ${count} pecas de conteudo para essa semana, mix balanceado entre carrosseis, reels e stories. Use a analise de concorrentes para identificar topicos relevantes que a Live Equipamentos pode dominar.`,
      }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock?.text) throw new Error('Resposta vazia do Claude')
    const parsed = JSON.parse(textBlock.text)
    const items = (parsed.items || []).slice(0, count).map(cleanItem)
    log?.info({ count: items.length, cacheRead: response.usage?.cache_read_input_tokens, cacheWrite: response.usage?.cache_creation_input_tokens }, 'contentPlanner: pauta gerada')
    return items
  } catch (err) {
    log?.error({ err: err.message }, 'contentPlanner: falha na geracao')
    return null
  }
}
