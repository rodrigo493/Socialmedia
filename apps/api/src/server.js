import Fastify from 'fastify'
import cors from '@fastify/cors'
import staticPlugin from '@fastify/static'
import fs from 'node:fs/promises'
import fssync from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { INTERNAL_TOKEN } from './services/internal.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..')
const SQUAD = path.join(ROOT, 'squads', 'live-social-media')
const OUTPUT = path.join(SQUAD, 'output')
const INVESTIGATIONS = path.join(SQUAD, '_investigations')

const app = Fastify({ logger: true })
await app.register(cors, {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true,
})
await app.register(staticPlugin, { root: OUTPUT, prefix: '/media/' })
const multipart = (await import('@fastify/multipart')).default
await app.register(multipart, { limits: { fileSize: 200 * 1024 * 1024 } }) // 200MB por arquivo

// Serve a pasta _products como /products/*
const PRODUCTS_DIR = path.join(ROOT, 'squads', 'live-social-media', '_products')
await app.register(staticPlugin, { root: PRODUCTS_DIR, prefix: '/products-media/', decorateReply: false })

// Serve frontend buildado (produção) — só registra se SERVE_STATIC apontar pra dist existente
const STATIC_DIR = process.env.SERVE_STATIC
if (STATIC_DIR && fssync.existsSync(STATIC_DIR)) {
  await app.register(staticPlugin, { root: STATIC_DIR, prefix: '/', decorateReply: false, wildcard: false })
  app.setNotFoundHandler((req, reply) => {
    // Rotas API já foram tratadas; aqui é fallback do SPA (tudo que não é /api, /media, /products-media)
    const url = req.url.split('?')[0]
    if (url.startsWith('/api/') || url.startsWith('/media/') || url.startsWith('/products-media/')) {
      return reply.code(404).send({ error: 'not found' })
    }
    return reply.sendFile('index.html')
  })
  app.log.info({ staticDir: STATIC_DIR }, 'serving frontend estático')
}

// --- Auth middleware (antes dos routes) -----------------------------------
const authSvc = await import('./services/auth.js')
const PUBLIC_PREFIXES = [
  '/api/v1/auth/status',
  '/api/v1/auth/setup',
  '/api/v1/auth/login',
  '/api/v1/health',
  '/api/v1/brand/logo/image', // imagens da logo servidas como <img>, sem Bearer
  '/api/v1/brand/manual/',     // arquivos do manual da marca servidos inline
  '/api/v1/drive/file/',       // arquivos do drive servidos inline
  '/media/',
  '/products-media/',
]
app.addHook('preHandler', async (req, reply) => {
  // Libera rotas públicas
  const url = req.url.split('?')[0]
  if (PUBLIC_PREFIXES.some(p => url.startsWith(p))) return
  if (!url.startsWith('/api/')) return // frontend static etc
  // Se ainda não tem user configurado, liberou (pra permitir o setup inicial)
  if (!(await authSvc.isConfigured())) return
  // Verifica Bearer
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  // Token interno (chamadas de serviço no mesmo processo)
  if (token === INTERNAL_TOKEN) { req.user = { username: '__internal__' }; return }
  if (!token) { reply.code(401); return reply.send({ error: 'não autenticado' }) }
  const u = await authSvc.verifyToken(token)
  if (!u) { reply.code(401); return reply.send({ error: 'token inválido' }) }
  req.user = u
})

const authRoutesMod = await import('./routes/auth.js')
await app.register(authRoutesMod.default)

// Registra rotas de chat e items
const chatMod = await import('./routes/chat.js')
await app.register(chatMod.default)
const itemsMod = await import('./routes/items.js')
await app.register(itemsMod.default)
const publishMod = await import('./routes/publish.js')
await app.register(publishMod.default)
const mediaMod = await import('./routes/media.js')
await app.register(mediaMod.default)
const productsMod = await import('./routes/products.js')
await app.register(productsMod.default)
const studioMod = await import('./routes/studio.js')
await app.register(studioMod.default)
const driveMod = await import('./routes/drive.js')
await app.register(driveMod.default)
const calendarMod = await import('./routes/calendar.js')
await app.register(calendarMod.default)
const brandMod = await import('./routes/brand.js')
await app.register(brandMod.default)
const exportMod = await import('./routes/export.js')
await app.register(exportMod.default)
const heygenMod = await import('./routes/heygen.js')
await app.register(heygenMod.default)
const analyticsMod = await import('./routes/analytics.js')
await app.register(analyticsMod.default)
const dashboardMod = await import('./routes/analytics-dashboard.js')
await app.register(dashboardMod.default)
const cycleMod = await import('./routes/cycle.js')
await app.register(cycleMod.default)
const instagramOSMod = await import('./routes/instagramOS.js')
await app.register(instagramOSMod.default)

// --- Reports ---------------------------------------------------------------

// List every *.report.json in output/, newest first
async function listReports() {
  try {
    const entries = await fs.readdir(OUTPUT, { withFileTypes: true })
    const reports = []
    for (const e of entries) {
      if (!e.isFile() || !e.name.endsWith('.report.json')) continue
      const full = path.join(OUTPUT, e.name)
      const stat = await fs.stat(full)
      reports.push({ file: e.name, path: full, mtime: stat.mtimeMs })
    }
    reports.sort((a, b) => b.mtime - a.mtime)
    return reports
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
}

app.get('/api/v1/reports', async () => {
  const items = await listReports()
  return items.map(({ file, mtime }) => ({ file, updatedAt: new Date(mtime).toISOString() }))
})

app.get('/api/v1/reports/latest', async (req, reply) => {
  const items = await listReports()
  if (items.length === 0) {
    reply.code(404)
    return { error: 'Nenhum relatório encontrado em squads/live-social-media/output/' }
  }
  const raw = await fs.readFile(items[0].path, 'utf8')
  try {
    return JSON.parse(raw)
  } catch (err) {
    reply.code(500)
    return { error: 'Report JSON inválido', file: items[0].file, detail: String(err) }
  }
})

app.get('/api/v1/reports/:file', async (req, reply) => {
  const name = path.basename(req.params.file)
  if (!name.endsWith('.report.json')) {
    reply.code(400)
    return { error: 'Extensão inválida' }
  }
  const full = path.join(OUTPUT, name)
  if (!full.startsWith(OUTPUT)) {
    reply.code(400)
    return { error: 'path traversal' }
  }
  try {
    const raw = await fs.readFile(full, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    reply.code(404)
    return { error: 'Não encontrado', file: name }
  }
})

// --- Investigations (fonte bruta das pesquisas) ----------------------------

app.get('/api/v1/investigations', async () => {
  try {
    const entries = await fs.readdir(INVESTIGATIONS, { withFileTypes: true })
    const profiles = []
    for (const e of entries) {
      if (!e.isDirectory()) continue
      const dir = path.join(INVESTIGATIONS, e.name)
      const files = await fs.readdir(dir)
      profiles.push({ handle: e.name, files })
    }
    // include consolidated if present
    const consolidated = path.join(INVESTIGATIONS, 'consolidated-analysis.md')
    const hasConsolidated = fssync.existsSync(consolidated)
    return { profiles, hasConsolidated }
  } catch (err) {
    if (err.code === 'ENOENT') return { profiles: [], hasConsolidated: false }
    throw err
  }
})

// --- Generate report stub --------------------------------------------------
// Opensquad runs inside Claude Code, so we can't "just run" it.
// This endpoint returns the instruction the user must execute.
app.post('/api/v1/reports/generate', async () => {
  return {
    status: 'manual',
    instruction:
      'Rode `/opensquad run live-social-media --step=inteligencia-competitiva` no Claude Code. O agente iris-influencer vai gerar squads/live-social-media/output/<data>.report.json seguindo pipeline/data/report.schema.json.',
  }
})

// --- Créditos --------------------------------------------------------------
const creditsMod = await import('./services/credits.js')
app.get('/api/v1/credits', async (req) => creditsMod.getAllCredits({ force: !!req.query.force }))

// --- Scheduler -------------------------------------------------------------
const schedulerMod = await import('./services/scheduler.js')
const SCHED_PORT = process.env.PORT || 3000
schedulerMod.start({
  log: app.log,
  onDue: async (ev) => {
    // publica via endpoint interno — usa fetch HTTP pro próprio backend
    const res = await fetch(`http://localhost:${SCHED_PORT}/api/v1/items/${ev.itemId}/publish`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${INTERNAL_TOKEN}`,
      },
      body: JSON.stringify({ targets: ev.networks }),
    })
    return res.json()
  },
})
app.get('/api/v1/scheduler/status', async () => ({
  auto: schedulerMod.isAuto(),
  hint: schedulerMod.isAuto()
    ? 'Scheduler ATIVO — eventos approved do Calendar serão publicados automaticamente.'
    : 'Scheduler em DRY-RUN — apenas loga. Para ativar publicação automática: SCHEDULER_AUTO_PUBLISH=true no .env.',
}))

// --- Instagram OS scheduler ------------------------------------------------
const igOSMod = await import('./services/instagramOS.js')
igOSMod.startWeeklyScheduler(app.log)

// --- Health ----------------------------------------------------------------
app.get('/api/v1/health', async () => ({ ok: true, root: ROOT, output: OUTPUT }))

app.setErrorHandler((err, req, reply) => {
  app.log.error({ err, url: req.url }, 'unhandled error')
  reply.code(err.statusCode || 500).send({ error: err.statusCode < 500 ? err.message : 'erro interno do servidor' })
})

const PORT = process.env.PORT || 3000
app.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => app.log.info(`API on :${PORT} · reports from ${OUTPUT}`))
  .catch(err => { app.log.error(err); process.exit(1) })
