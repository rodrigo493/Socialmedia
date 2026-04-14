// Gera resposta do agente. Se ANTHROPIC_API_KEY estiver setada, usa Claude real.
// Caso contrário, retorna uma resposta heurística estruturada — suficiente para
// demonstrar o fluxo e colocar itens em Criados.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadPersona } from './agents.js'
import * as ffmpeg from './ffmpeg.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const KEY = process.env.ANTHROPIC_API_KEY

// Carrega contexto de marca uma única vez — injetado em todos os agentes
let _brandContext = null
export function _resetBrandCache() { _brandContext = null }
async function brandContext() {
  if (_brandContext != null) return _brandContext
  try {
    const company = await fs.readFile(path.join(ROOT, '_opensquad', '_memory', 'company.md'), 'utf8')
    const prefs = await fs.readFile(path.join(ROOT, '_opensquad', '_memory', 'preferences.md'), 'utf8').catch(() => '')
    _brandContext = [
      '## CONTEXTO DE MARCA (sempre carregado)',
      company,
      prefs ? '\n## PREFERÊNCIAS\n' + prefs : '',
    ].filter(Boolean).join('\n')
  } catch {
    _brandContext = ''
  }
  return _brandContext
}

const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm'])
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' }

async function attachmentsToContent(attachments = []) {
  const blocks = []
  const notes = []
  for (const a of attachments) {
    const ext = path.extname(a.saved || a.path || '').toLowerCase()
    const abs = path.join(ROOT, a.path) // a.path vem como "squads/.../output/_uploads/arquivo.png"
    if (IMG_EXT.has(ext)) {
      try {
        const buf = await fs.readFile(abs)
        const b64 = buf.toString('base64')
        blocks.push({ type: 'image', source: { type: 'base64', media_type: MIME[ext], data: b64 } })
      } catch (err) {
        notes.push(`(anexo ${a.saved} não pôde ser lido: ${err.message})`)
      }
    } else if (VIDEO_EXT.has(ext)) {
      // Extrai 4 frames do vídeo e manda como imagens — Claude consegue "ver" o vídeo
      try {
        const frameDir = abs + '.frames'
        const frames = await ffmpeg.extractFrames({ inputPath: abs, outDir: frameDir, count: 4 })
        for (const framePath of frames.slice(0, 4)) {
          const buf = await fs.readFile(framePath)
          blocks.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: buf.toString('base64') } })
        }
        notes.push(`(Vídeo ${a.saved}: extraí ${frames.length} frames pra você analisar.)`)
      } catch (err) {
        notes.push(`Vídeo ${a.saved} anexado mas não consegui extrair frames (${err.message}). Caminho: ${a.path}`)
      }
    } else {
      notes.push(`Anexo ${a.saved} (tipo não reconhecido) em ${a.path}`)
    }
  }
  return { blocks, notes }
}

export async function respond({ agent, message, history = [], attachments = [] }) {
  if (KEY) return respondWithClaude({ agent, message, history, attachments })
  return respondHeuristic({ agent, message, history, attachments })
}

async function respondWithClaude({ agent, message, history, attachments }) {
  const [persona, brand] = await Promise.all([loadPersona(agent.id), brandContext()])
  const system = [
    `Você é ${agent.id} do squad live-social-media da Live Universe (marca Live Equipamentos · @liveequipamentos).`,
    brand ? `\n${brand}\n` : '',
    `\n## SUA PERSONA DE AGENTE\n${persona}`,
    '\n## AMBIENTE DE EXECUÇÃO — LEIA COM ATENÇÃO',
    'Você NÃO é apenas um estrategista/roteirista. Aqui, neste painel, você opera dentro de um pipeline de produção TOTALMENTE AUTOMATIZADO. Qualquer conteúdo que você propor será GERADO DE VERDADE em background quando o usuário clicar "Criar":',
    '- Imagens (capas, slides de carrossel, character sheets de persona IA) → Nano Banana (Gemini Flash Image)',
    '- Vídeos cinematográficos → Veo 3 ou Kling 2.5 (image-to-video)',
    '- Vídeos talking-head com lip-sync → HeyGen',
    '- Voz em português → ElevenLabs (voz feminina "Ana Lua" ou masculina configurada)',
    '- Composição final com voz sincronizada → FFmpeg local',
    '- Publicação direta no Instagram/TikTok → Playwright automatizado',
    '',
    'PROIBIDO dizer qualquer coisa como "a geração técnica precisa ser feita pela equipe de produção", "eu apenas crio o roteiro", "você precisa passar para um designer". ISSO É FALSO NESTE CONTEXTO. Tudo é automático.',
    '',
    '\n## REGRAS DE RESPOSTA',
    '- Responda em português brasileiro, tom direto, no máximo 220 palavras.',
    '- Quando receber IMAGENS ou VÍDEOS em anexo: analise com precisão, descreva o que vê, relacione com produtos Live ou personas existentes.',
    '- Para pedidos criativos (carrossel, reel, story, anúncio, persona IA): anuncie O QUE VOCÊ VAI PRODUZIR — 3 a 5 bullets curtos descrevendo concretamente o resultado final (ex: "vídeo 9:16 de 8s, plano médio, persona feminina ajustando mola do Reformer V12, voz feminina com fala X, trilha ambiente"). NADA de roteiros longos em prosa.',
    '- Termine SEMPRE pedidos criativos com exatamente essa frase e nada depois dela: "Posso produzir isso agora?"',
    '- Tom de voz Live: direto, estratégico, provocativo com autoridade.',
  ].filter(Boolean).join('\n')

  const { blocks: imageBlocks, notes } = await attachmentsToContent(attachments)

  const userContent = [
    ...imageBlocks,
    { type: 'text', text: message + (notes.length ? '\n\n' + notes.join('\n') : '') },
  ]

  const messages = [
    ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
    { role: 'user', content: userContent },
  ]

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 900, system, messages }),
  })
  if (!res.ok) throw new Error('Claude API: ' + res.status + ' ' + await res.text())
  const data = await res.json()
  const text = data.content?.map(c => c.text).filter(Boolean).join('\n') || ''
  return { text, draft: extractDraft(text, agent, message) }
}

function respondHeuristic({ agent, message, attachments = [] }) {
  const m = message.trim()
  const hasImages = attachments.some(a => IMG_EXT.has(path.extname(a.saved || '').toLowerCase()))
  if (hasImages) {
    // Sem Claude real, aviso
    const notice = `[Visão indisponível no modo heurístico — recebi ${attachments.length} anexo(s). Configure ANTHROPIC_API_KEY para que o agente analise as imagens.]\n\n`
    return { text: notice + buildSuggestion(agent, m).body, draft: null }
  }
  const opener = {
    'caio-carrossel': `Ok, vamos pensar um carrossel. Vi o seu pedido: "${trim(m)}".`,
    'davi-destaque': `Show, reel é o que faz barulho. Analisei seu input: "${trim(m)}".`,
    'elisa-efemera': `Story é rápido e quente. Rascunho aqui em cima do que você disse: "${trim(m)}".`,
    'giovana-gancho': `Peguei. Gancho certo muda tudo. Sua ideia: "${trim(m)}".`,
    'henrique-horizonte': `Vamos zoom out. Seu pedido: "${trim(m)}". Aqui vai um esqueleto mensal.`,
    'fabio-funil': `Funil não é gatilho, é arquitetura. Para "${trim(m)}", pensei assim:`,
    'amanda-anuncio': `Para rodar mídia paga em "${trim(m)}", estrutura básica:`,
    'iris-influencer': `Peguei. Vou montar a persona digital em 3 entregas — Persona, Character Sheet e Video Script. Input: "${trim(m)}".`,
    'bruno-balizador': `Deixa eu revisar pela régua de marca: "${trim(m)}".`,
    'paula-postagem': `Para publicar "${trim(m)}", minha sugestão de janela e sequência:`,
  }[agent.id] || 'Recebi sua mensagem.'

  const suggestion = buildSuggestion(agent, m)
  const text = `${opener}\n\n${suggestion.body}\n\nPosso criar isso como draft?`
  return { text, draft: suggestion.draft }
}

function buildSuggestion(agent, message) {
  const topic = message.replace(/[?!.]+$/g, '').slice(0, 80) || 'tema livre'
  if (agent.id === 'caio-carrossel') {
    const slides = [
      { idx: 1, headline: topic, sub: 'O erro que ninguém te contou.' },
      { idx: 2, headline: '01 · O diagnóstico', sub: 'Onde a maioria dos studios trava.' },
      { idx: 3, headline: '02 · O custo invisível', sub: 'Cada dia perdido sai caro.' },
      { idx: 4, headline: '03 · A jogada certa', sub: 'Três movimentos que destravam.' },
      { idx: 5, headline: 'Comenta SQUAD', sub: 'Diagnóstico gratuito no seu direct.' },
    ]
    return {
      body: slides.map(s => `Slide ${s.idx}: ${s.headline} — ${s.sub}`).join('\n'),
      draft: {
        type: 'carousel',
        title: topic,
        caption: `${topic}\n\nSe isso te incomoda, o carrossel é pra você.\n\nComenta SQUAD que eu mando o diagnóstico.\n\n#pilates #studio #gestao`,
        slides,
      },
    }
  }
  if (agent.id === 'davi-destaque') {
    return {
      body: `Gancho: "${topic}"\nCena 1: plano aberto (3s) — contraste visual.\nCena 2: declaração em câmera (10s) — 1 frase de peso.\nCena 3: prova visual (12s) — equipamento em uso.\nCena 4: CTA (5s) — "comenta SQUAD".`,
      draft: { type: 'reel', title: topic, duration: '00:30', caption: topic + '\n\n#reels #pilates' },
    }
  }
  if (agent.id === 'elisa-efemera') {
    return {
      body: `4 frames: 1) teaser com pergunta / 2) bastidor real / 3) enquete / 4) CTA para direct.`,
      draft: { type: 'story', title: topic, frames: 4, caption: topic },
    }
  }
  if (agent.id === 'iris-influencer') {
    // Detecta arquétipo no texto do usuário
    const t = message.toLowerCase()
    const archMap = [
      ['ruiva', 'ruiva'], ['negra', 'negra'], ['tranç', 'negra'],
      ['loira', 'loira'], ['blonde', 'loira'],
      ['morena', 'morena'], ['castanh', 'morena'],
      ['idos', 'mulher-idosa'], ['80 anos', 'mulher-idosa'],
      ['60 anos', 'mulher-meia-idade'], ['meia-idade', 'mulher-meia-idade'],
      ['homem negro', 'homem-negro'], ['homem ruivo', 'homem-ruivo'],
      ['homem loiro', 'homem-loiro'], ['homem 60', 'homem-meia-idade'], ['homem 80', 'homem-idoso'],
    ]
    const hit = archMap.find(([k]) => t.includes(k))
    const archetype = hit ? hit[1] : 'morena-cinema'
    const archLabels = {
      'ruiva': 'Ruiva 29 anos', 'negra': 'Negra 27 anos com tranças', 'morena': 'Morena 20 anos',
      'morena-cinema': 'Morena cinematográfica 8K', 'loira': 'Loira 20 anos', 'loira-cinema': 'Loira cinematográfica 8K',
      'mulher-meia-idade': 'Mulher 60 anos', 'mulher-idosa': 'Mulher 80 anos',
      'homem-loiro': 'Homem loiro 25', 'homem-ruivo': 'Homem ruivo 25', 'homem-negro': 'Homem negro 30',
      'homem-meia-idade': 'Homem 60', 'homem-idoso': 'Homem 80',
    }

    return {
      body: [
        `Vou montar a persona em 3 entregas — **Persona → Character Sheet → Video Script** — usando a biblioteca oficial Live (Caixa Secreta).`,
        ``,
        `**ARQUÉTIPO sugerido:** ${archLabels[archetype]} (detectei "${hit ? hit[0] : 'morena cinematográfica como default'}" no seu pedido).`,
        `Purpose: ${topic}.`,
        ``,
        `**PRÓXIMO PASSO ao clicar Criar:**`,
        `1) Gerar rosto-base via Nano Banana usando o prompt oficial do arquétipo`,
        `2) 4 ângulos de character sheet (frente / direita / esquerda / costas) — Fundo Neutro`,
        `3) Script de vídeo em 2 camadas (direção visual + fala) pronto para Veo 3 + ElevenLabs (voz feminina)`,
        ``,
        `Se o arquétipo estiver errado, me diga qual quer: ruiva, negra, morena, loira, mulher-meia-idade, mulher-idosa, homem-loiro, homem-ruivo, homem-negro, homem-meia-idade, homem-idoso.`,
      ].join('\n'),
      draft: {
        type: 'influencer_brief',
        title: `Persona Digital · ${archLabels[archetype]}`,
        caption: `Arquétipo: ${archLabels[archetype]}\nPurpose (Live Equipamentos): ${topic}\n\nEntregas: rosto-base + 4 ângulos + script de vídeo.`,
        archetype,
        metrics: { followers: 'persona digital', engagement: 'Veo 3', fit: 'ICP Live' },
      },
    }
  }
  // fallback
  return {
    body: `Ideia base: ${topic}. Quer que eu desenvolva em carrossel, reel ou story?`,
    draft: null,
  }
}

function trim(s) { return s.length > 80 ? s.slice(0, 80) + '…' : s }

function extractDraft(text, agent, message) {
  // Placeholder para quando a Claude real responde — por ora devolve um draft genérico
  // se a mensagem parece pedir criação.
  const m = message.toLowerCase()
  if (!/(cria|faz|monta|escreve|gera|sugere|ideia)/.test(m)) return null
  const topic = message.replace(/[?!.]+$/g, '').slice(0, 80)
  if (agent.id === 'caio-carrossel') {
    return { type: 'carousel', title: topic, caption: topic, slides: [{ idx: 1, headline: topic, sub: '' }] }
  }
  if (agent.id === 'davi-destaque') {
    return { type: 'reel', title: topic, duration: '00:30', caption: topic }
  }
  if (agent.id === 'elisa-efemera') {
    return { type: 'story', title: topic, frames: 4, caption: topic }
  }
  return null
}
