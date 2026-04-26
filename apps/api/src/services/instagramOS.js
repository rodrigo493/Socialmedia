// Instagram OS — pipeline de inteligência competitiva
// Fases: 1) Meus reels  2) Reels dos concorrentes  3) Relatório estratégico + email

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getReels } from './apify.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data')
const CONFIG_FILE = path.join(DATA_DIR, 'instagram-os-config.json')
const REPORTS_DIR = path.join(DATA_DIR, 'instagram-os-reports')

const GOOGLE_KEY = process.env.GOOGLE_AI_STUDIO_KEY
const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY

// ─── Config ────────────────────────────────────────────────────────────────
const DEFAULT_CONFIG = { username: 'liveequipamentos', competitors: [], emails: [] }

export async function loadConfig() {
  try {
    return JSON.parse(await fs.readFile(CONFIG_FILE, 'utf8'))
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export async function saveConfig(cfg) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(CONFIG_FILE, JSON.stringify(cfg, null, 2))
}

// ─── Estado do run ─────────────────────────────────────────────────────────
let _state = { status: 'idle', startedAt: null, finishedAt: null, phase: null, log: [], error: null, reportId: null }

export function getStatus() { return { ..._state } }

function log(msg) {
  _state.log.push({ t: new Date().toISOString(), msg })
  console.log('[instagram-os]', msg)
}

// ─── Gemini video analysis (download → Files API → generateContent) ─────────
const VIDEO_PROMPT = `**IDIOMA OBRIGATÓRIO: TODO O OUTPUT DEVE SER EM PORTUGUÊS BRASILEIRO (PT-BR).**

# ROLE
Você é um analista de conteúdo de redes sociais especializado em vídeos do Instagram/TikTok.

# TASK
Assista a este vídeo e extraia um resumo do conteúdo que captura o que faz este vídeo funcionar.

Identifique o formato: comparação visual (split screen, antes/depois), script (alguém falando), montagem visual ou meme/texto sobreposto.

# OUTPUT CONSTRAINTS
- Máximo 1500 caracteres
- Texto puro, sem timestamps
- Capture o que torna o vídeo envolvente

# OUTPUT FORMAT
Comece diretamente com o resumo do conteúdo`

async function analyzeVideoWithGemini(videoUrl) {
  if (!GOOGLE_KEY || !videoUrl) return ''
  try {
    const dlRes = await fetch(videoUrl, { signal: AbortSignal.timeout(60_000) })
    if (!dlRes.ok) return ''
    const contentType = dlRes.headers.get('content-type') || 'video/mp4'
    const videoBuffer = Buffer.from(await dlRes.arrayBuffer())

    // Upload to Files API (multipart)
    const boundary = `os-${Date.now()}`
    const meta = JSON.stringify({ file: { displayName: 'reel' } })
    const head = `--${boundary}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`
    const tail = `\r\n--${boundary}--`
    const body = Buffer.concat([Buffer.from(head), videoBuffer, Buffer.from(tail)])

    const up = await fetch(
      'https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=multipart',
      {
        method: 'POST',
        headers: { 'x-goog-api-key': GOOGLE_KEY, 'content-type': `multipart/related; boundary=${boundary}` },
        body,
        signal: AbortSignal.timeout(120_000),
      }
    )
    if (!up.ok) return ''
    let { file } = await up.json()

    // Wait for ACTIVE
    for (let i = 0; i < 30 && file.state === 'PROCESSING'; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const chk = await fetch(`https://generativelanguage.googleapis.com/v1beta/${file.name}`, {
        headers: { 'x-goog-api-key': GOOGLE_KEY },
      })
      file = await chk.json()
    }
    if (file.state !== 'ACTIVE') return ''

    // Generate content
    const gen = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': GOOGLE_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: VIDEO_PROMPT }, { fileData: { mimeType: contentType, fileUri: file.uri } }] }],
          generationConfig: { maxOutputTokens: 800, temperature: 0.3 },
        }),
        signal: AbortSignal.timeout(60_000),
      }
    )
    const gd = await gen.json()

    // Cleanup (best effort)
    fetch(`https://generativelanguage.googleapis.com/v1beta/${file.name}`, {
      method: 'DELETE', headers: { 'x-goog-api-key': GOOGLE_KEY },
    }).catch(() => {})

    return gd.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } catch { return '' }
}

// ─── Claude Haiku — hook analysis ─────────────────────────────────────────
const HOOK_PROMPT = `Identifique o VERDADEIRO HOOK deste vídeo — o que faz alguém PARAR DE ROLAR.

Verifique em ordem:
1. Texto sobreposto no início? → esse é o hook (especialmente formato meme/comédia)
2. Estrutura visual ao longo do vídeo? (split screen, comparação) → essa estrutura é o hook
3. Alguém falando sem texto ou estrutura? → a frase de abertura é o hook

IGNORE: música de fundo/sons em tendência não relacionados ao conteúdo.

Se o transcript estiver vazio ou falhou, retorne apenas um espaço: " "

OUTPUT — EXATAMENTE 3 linhas:
Linha 1: O hook
Linha 2: (em branco)
Linha 3: Palavras-chave: [palavras]

PARE após a linha 3. Sem explicações extras.

<input>
`

async function analyzeHookWithClaude(transcript) {
  if (!CLAUDE_KEY || !transcript) return ''
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: HOOK_PROMPT + transcript + '\n</input>' }],
      }),
      signal: AbortSignal.timeout(30_000),
    })
    const d = await res.json()
    return d.content?.[0]?.text || ''
  } catch { return '' }
}

// ─── Analisa um array de reels em lotes (paralelismo controlado) ───────────
async function analyzeReels(reels, label) {
  const results = []
  const BATCH = 3
  for (let i = 0; i < reels.length; i += BATCH) {
    const batch = reels.slice(i, i + BATCH)
    log(`${label}: analisando vídeos ${i + 1}–${Math.min(i + BATCH, reels.length)}/${reels.length}`)
    const analyzed = await Promise.all(batch.map(async reel => {
      const transcript = await analyzeVideoWithGemini(reel.videoUrl)
      const hookAnalysis = await analyzeHookWithClaude(transcript)
      return { ...reel, transcript, hookAnalysis }
    }))
    results.push(...analyzed)
  }
  return results
}

// ─── Claude Sonnet — análise estratégica ──────────────────────────────────
function buildStrategicPrompt(username, myReels, competitorReels) {
  return `**IDIOMA OBRIGATÓRIO: TODO O OUTPUT DEVE SER EM PORTUGUÊS BRASILEIRO (PT-BR).**

Você é um estrategista expert de conteúdo no Instagram.

<context>
<my_account>Username: ${username}</my_account>
<my_reels>${JSON.stringify(myReels.map(r => ({ url: r.url, views: r.videoPlayCount, likes: r.likesCount, comments: r.commentsCount, hook: r.hookAnalysis, caption: (r.caption || '').slice(0, 500), date: r.timestamp })))}</my_reels>
<competitor_reels>${JSON.stringify(competitorReels.map(r => ({ url: r.url, username: r.ownerUsername, views: r.videoPlayCount, hook: r.hookAnalysis, caption: (r.caption || '').slice(0, 300), date: r.timestamp })))}</competitor_reels>
</context>

<task>
PASSO 1: Selecione os TOP 5 vídeos dos concorrentes (maior views).
PASSO 2: Analise cada um dos 5 (gatilho psicológico, mecânica de execução, insight oculto).
PASSO 3: Identifique 3 padrões vencedores cruzando ambos os datasets.
PASSO 4: Crie 10 ideias de hook adaptadas ao estilo de ${username}.
PASSO 5: Crie 10 roteiros de vídeo de 1 minuto (formato A/V) em PORTUGUÊS BRASILEIRO — um para cada hook.
PASSO 6: Key takeaway: insight mais importante + 3-5 ações imediatas.
</task>

Retorne APENAS JSON válido com esta estrutura exata:
{
  "top_competitor_videos": [{ "rank": 1, "hook": "", "url": "", "views": 0, "posted_date": "", "creator": "", "why_it_worked": "" }],
  "winning_patterns": [{ "pattern_name": "", "explanation": "" }],
  "hook_ideas": [{ "hook_number": 1, "hook": "", "why_it_works": "" }],
  "video_scripts": [{ "script_number": 1, "hook_reference": "", "estimated_duration": "60 segundos", "script": "" }],
  "key_takeaway": ""
}

REGRAS CRÍTICAS:
- top_competitor_videos: exatamente 5 objetos
- winning_patterns: exatamente 3 objetos
- hook_ideas: exatamente 10 objetos
- video_scripts: exatamente 10 objetos — TODOS EM PORTUGUÊS BRASILEIRO
- views deve ser número, não string
- Resposta deve começar com { e terminar com }
- SEM markdown, SEM texto fora do JSON`
}

async function runStrategicAnalysis(username, myReels, competitorReels) {
  if (!CLAUDE_KEY) throw new Error('ANTHROPIC_API_KEY necessário para análise estratégica')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: buildStrategicPrompt(username, myReels, competitorReels) }],
    }),
    signal: AbortSignal.timeout(120_000),
  })
  const d = await res.json()
  const text = d.content?.[0]?.text || '{}'
  try {
    return JSON.parse(text)
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    return m ? JSON.parse(m[0]) : {}
  }
}

// ─── HTML report ──────────────────────────────────────────────────────────
function buildReportHtml(analysis, generatedAt) {
  const esc = s => String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]))
  const nl = s => esc(s).replace(/\n/g, '<br>')

  const videos = (analysis.top_competitor_videos || []).map((v, i) => `
    <div class="card border-blue">
      <span class="badge blue">Rank #${v.rank || i + 1}</span>
      <div class="hook-text">"${esc(v.hook)}"</div>
      <div class="meta">
        <span>👁 ${Number(v.views || 0).toLocaleString('pt-BR')} views</span>
        <span>👤 @${esc(v.creator)}</span>
        <span>📅 ${esc(v.posted_date)}</span>
      </div>
      ${v.url ? `<a href="${esc(v.url)}" target="_blank" class="link">Ver post original ↗</a>` : ''}
      <div class="analysis">${nl(v.why_it_worked)}</div>
    </div>`).join('')

  const patterns = (analysis.winning_patterns || []).map(p => `
    <div class="card">
      <div class="title-blue">${esc(p.pattern_name)}</div>
      <div class="body">${nl(p.explanation)}</div>
    </div>`).join('')

  const hooks = (analysis.hook_ideas || []).map(h => `
    <div class="card">
      <span class="badge dark">Hook #${h.hook_number}</span>
      <div class="hook-text">"${esc(h.hook)}"</div>
      <div class="reason">${nl(h.why_it_works)}</div>
    </div>`).join('')

  const scripts = (analysis.video_scripts || []).map(s => `
    <div class="card border-green">
      <div class="script-header">
        <span class="badge green">Roteiro #${s.script_number}</span>
        <span class="duration">⏱ ${esc(s.estimated_duration)}</span>
      </div>
      <div class="hook-ref">Baseado em: ${esc(s.hook_reference)}</div>
      <pre class="script">${esc(s.script)}</pre>
    </div>`).join('')

  const takeaway = analysis.key_takeaway ? `
    <div class="takeaway">
      <h2>🎯 Key Takeaway</h2>
      <div>${nl(analysis.key_takeaway)}</div>
    </div>` : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Instagram OS Report</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#111;color:#e5e5e5;padding:2rem 1rem;line-height:1.6}
.container{max-width:1100px;margin:0 auto}
.header{background:linear-gradient(135deg,#1e3a8a,#3b82f6);border-radius:12px;padding:2.5rem 2rem;text-align:center;margin-bottom:2rem}
.header h1{font-size:2rem;font-weight:700;color:#fff}
.header p{opacity:.8;color:#fff;margin-top:.25rem}
.section{margin-bottom:3rem}
h2{font-size:1.4rem;color:#60a5fa;margin-bottom:1rem;padding-bottom:.5rem;border-bottom:2px solid #1e40af}
.card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;padding:1.25rem;margin-bottom:1rem}
.border-blue{border-left:4px solid #3b82f6}
.border-green{border-left:4px solid #22c55e}
.badge{display:inline-block;font-size:.8rem;font-weight:700;padding:.25rem .75rem;border-radius:20px;margin-bottom:.75rem}
.blue{background:#1e40af;color:#fff}
.dark{background:#374151;color:#fff}
.green{background:#15803d;color:#fff}
.hook-text{font-size:1.15rem;font-weight:600;margin-bottom:.75rem;color:#f3f4f6}
.meta{display:flex;flex-wrap:wrap;gap:1rem;font-size:.85rem;color:#9ca3af;margin-bottom:.75rem}
.link{color:#60a5fa;text-decoration:none;font-weight:600;display:inline-block;margin-bottom:.75rem}
.analysis,.body,.reason{font-size:.9rem;color:#d1d5db;background:#111;padding:.75rem;border-radius:6px}
.title-blue{font-size:1.1rem;font-weight:700;color:#93c5fd;margin-bottom:.75rem}
.script-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem}
.duration{font-size:.85rem;color:#9ca3af}
.hook-ref{font-size:.85rem;color:#9ca3af;font-style:italic;margin-bottom:.75rem}
pre.script{font-family:'Courier New',monospace;font-size:.85rem;line-height:1.7;background:#111;padding:1rem;border-radius:6px;white-space:pre-wrap;color:#d1d5db}
.takeaway{background:linear-gradient(135deg,#1e3a8a,#3b82f6);border-radius:12px;padding:2rem;color:#fff;margin-top:2rem}
.takeaway h2{color:#fff;border-color:rgba(255,255,255,.3)}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>📊 Instagram OS — Relatório Estratégico</h1>
    <p>Gerado em ${new Date(generatedAt).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}</p>
  </div>
  <div class="section"><h2>🏆 Top Vídeos dos Concorrentes</h2>${videos || '<p>Sem dados</p>'}</div>
  <div class="section"><h2>🎨 Padrões Vencedores</h2>${patterns || '<p>Sem dados</p>'}</div>
  <div class="section"><h2>💡 Ideias de Hook</h2>${hooks || '<p>Sem dados</p>'}</div>
  <div class="section"><h2>🎬 Roteiros de Vídeo</h2>${scripts || '<p>Sem dados</p>'}</div>
  ${takeaway}
</div>
</body>
</html>`
}

// ─── Email ─────────────────────────────────────────────────────────────────
async function sendReportEmail(emails, html) {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass || !emails.length) return

  try {
    const { default: nodemailer } = await import('nodemailer')
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user, pass },
    })
    await transporter.sendMail({
      from: `Instagram OS <${user}>`,
      to: emails.join(', '),
      subject: `Instagram OS — Relatório ${new Date().toLocaleDateString('pt-BR')}`,
      html,
    })
    log(`Email enviado para ${emails.join(', ')}`)
  } catch (err) {
    log(`Email falhou: ${err.message}`)
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function filterReels(reels, { maxAgeDays, maxDurationSec = 300 }) {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
  return reels.filter(r => {
    const ts = r.timestamp ? new Date(r.timestamp).getTime() : 0
    return ts > cutoff && (r.videoDuration || 0) < maxDurationSec
  })
}

function sortByViews(reels) {
  return [...reels].sort((a, b) => (b.videoPlayCount || 0) - (a.videoPlayCount || 0))
}

// ─── Main pipeline ─────────────────────────────────────────────────────────
export async function run(logger) {
  if (_state.status === 'running') throw new Error('Pipeline já em execução')

  _state = { status: 'running', startedAt: new Date().toISOString(), finishedAt: null, phase: null, log: [], error: null, reportId: null }

  ;(async () => {
    try {
      const cfg = await loadConfig()
      log(`Iniciando pipeline para @${cfg.username} + ${cfg.competitors.length} concorrentes`)

      // ── Fase 1: Meus reels ──
      _state.phase = 'my-reels'
      log('Fase 1: buscando meus reels no Apify…')
      const rawMy = await getReels({ username: cfg.username, limit: 20 })
      const myFiltered = sortByViews(filterReels(rawMy, { maxAgeDays: 90 })).slice(0, 15)
      log(`Fase 1: ${myFiltered.length} reels selecionados — analisando com Gemini + Claude…`)
      const myReels = await analyzeReels(myFiltered, 'Meus Reels')
      log(`Fase 1 concluída: ${myReels.length} reels analisados`)

      // ── Fase 2: Concorrentes ──
      _state.phase = 'competitors'
      const top5Comps = cfg.competitors.slice(0, 5)
      const allCompReels = []
      for (const comp of top5Comps) {
        log(`Fase 2: buscando reels de @${comp}…`)
        try {
          const raw = await getReels({ username: comp, limit: 15 })
          const filtered = sortByViews(filterReels(raw, { maxAgeDays: 14 })).slice(0, 5)
          log(`@${comp}: ${filtered.length} reels — analisando…`)
          const analyzed = await analyzeReels(filtered, `@${comp}`)
          allCompReels.push(...analyzed)
        } catch (err) {
          log(`@${comp} falhou: ${err.message}`)
        }
      }
      log(`Fase 2 concluída: ${allCompReels.length} reels de concorrentes analisados`)

      // ── Fase 3: Relatório ──
      _state.phase = 'report'
      log('Fase 3: análise estratégica com Claude Sonnet…')
      const analysis = await runStrategicAnalysis(cfg.username, myReels, allCompReels)
      const generatedAt = new Date().toISOString()
      const reportHtml = buildReportHtml(analysis, generatedAt)

      // Salva relatório
      await fs.mkdir(REPORTS_DIR, { recursive: true })
      const reportId = `report-${Date.now()}`
      await fs.writeFile(path.join(REPORTS_DIR, `${reportId}.json`), JSON.stringify({ analysis, generatedAt, username: cfg.username }, null, 2))
      await fs.writeFile(path.join(REPORTS_DIR, `${reportId}.html`), reportHtml)

      // Email
      log('Enviando relatório por email…')
      await sendReportEmail(cfg.emails || [], reportHtml)

      _state.status = 'done'
      _state.finishedAt = new Date().toISOString()
      _state.reportId = reportId
      _state.phase = null
      log('Pipeline concluído com sucesso ✓')
    } catch (err) {
      _state.status = 'error'
      _state.error = err.message
      _state.finishedAt = new Date().toISOString()
      log(`Erro: ${err.message}`)
    }
  })()
}

// ─── Relatório mais recente ─────────────────────────────────────────────────
export async function getLatestReport() {
  try {
    const files = await fs.readdir(REPORTS_DIR)
    const jsons = files.filter(f => f.endsWith('.json')).sort().reverse()
    if (!jsons.length) return null
    const raw = await fs.readFile(path.join(REPORTS_DIR, jsons[0]), 'utf8')
    return JSON.parse(raw)
  } catch { return null }
}

export async function getLatestReportHtml() {
  try {
    const files = await fs.readdir(REPORTS_DIR)
    const htmls = files.filter(f => f.endsWith('.html')).sort().reverse()
    if (!htmls.length) return null
    return fs.readFile(path.join(REPORTS_DIR, htmls[0]), 'utf8')
  } catch { return null }
}

export async function listReports() {
  try {
    const files = await fs.readdir(REPORTS_DIR)
    return files
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()
      .map(f => ({ id: f.replace('.json', ''), file: f }))
  } catch { return [] }
}

// ─── Scheduler semanal (domingo 7h) ────────────────────────────────────────
let _weeklyTimer = null

export function startWeeklyScheduler(logger) {
  if (_weeklyTimer) return
  _weeklyTimer = setInterval(() => {
    const now = new Date()
    if (now.getDay() !== 0 || now.getHours() !== 7) return
    if (_state.status === 'running') return
    // evita rodar mais de uma vez no mesmo domingo
    if (_state.finishedAt && (Date.now() - new Date(_state.finishedAt)) < 6 * 60 * 60 * 1000) return
    logger?.info?.('[instagram-os] scheduler semanal disparado')
    run(logger).catch(() => {})
  }, 30 * 60 * 1000) // verifica a cada 30min
}
