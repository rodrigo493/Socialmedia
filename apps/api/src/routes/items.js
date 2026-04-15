import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { INTERNAL_TOKEN } from '../services/internal.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const CRIADOS = path.join(ROOT, 'squads', 'live-social-media', 'output', 'criados')

async function ensureDir() { await fs.mkdir(CRIADOS, { recursive: true }) }

function slug(s) {
  return (s || 'item').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
}

export default async function itemRoutes(app) {
  app.get('/api/v1/items/:id', async (req, reply) => {
    const id = req.params.id
    try {
      const raw = await fs.readFile(path.join(CRIADOS, `${id}.item.json`), 'utf8')
      return JSON.parse(raw)
    } catch {
      reply.code(404); return { error: 'item não encontrado' }
    }
  })

  app.patch('/api/v1/items/:id', async (req, reply) => {
    const id = req.params.id
    const file = path.join(CRIADOS, `${id}.item.json`)
    try {
      const raw = await fs.readFile(file, 'utf8')
      const item = JSON.parse(raw)
      Object.assign(item, req.body || {})
      await fs.writeFile(file, JSON.stringify(item, null, 2))
      return item
    } catch {
      reply.code(404); return { error: 'item não encontrado' }
    }
  })

  app.delete('/api/v1/items/:id', async (req, reply) => {
    const id = req.params.id
    await fs.unlink(path.join(CRIADOS, `${id}.item.json`)).catch(() => {})
    await fs.rm(path.join(CRIADOS, id), { recursive: true, force: true }).catch(() => {})
    return { ok: true }
  })

  app.get('/api/v1/items', async (req) => {
    await ensureDir()
    const files = await fs.readdir(CRIADOS).catch(() => [])
    const items = []
    for (const f of files) {
      if (!f.endsWith('.item.json')) continue
      try {
        const raw = await fs.readFile(path.join(CRIADOS, f), 'utf8')
        items.push(JSON.parse(raw))
      } catch {}
    }
    items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    const { status, type } = req.query || {}
    return items.filter(i =>
      (!status || i.status === status) && (!type || i.type === type)
    )
  })

  app.post('/api/v1/items', async (req, reply) => {
    const draft = req.body || {}
    if (!draft.type || !draft.title) {
      reply.code(400); return { error: 'type e title são obrigatórios' }
    }
    const createdAt = new Date().toISOString()
    const id = draft.id || `${draft.type}-${createdAt.slice(0,10)}-${slug(draft.title)}`
    const autoGenerate = draft.autoGenerate !== false // default true
    const item = {
      id,
      type: draft.type,
      agent: draft.agent || 'chat',
      squad: 'live-social-media',
      createdAt,
      status: autoGenerate ? 'generating' : 'pending_approval',
      title: draft.title,
      caption: draft.caption || '',
      targets: draft.targets || defaultTargets(draft.type),
      ...('slides' in draft ? { slides: draft.slides } : {}),
      ...('duration' in draft ? { duration: draft.duration } : {}),
      ...('frames' in draft ? { frames: draft.frames } : {}),
      ...('archetype' in draft ? { archetype: draft.archetype } : {}),
      ...('persona' in draft ? { persona: draft.persona } : {}),
      ...('script' in draft ? { script: draft.script } : {}),
      ...('voiceText' in draft ? { voiceText: draft.voiceText } : {}),
      source: { origin: 'chat' },
    }
    await ensureDir()
    const itemPath = path.join(CRIADOS, `${id}.item.json`)
    await fs.writeFile(itemPath, JSON.stringify(item, null, 2))

    // Auto-disparar geração em background (não bloqueia o response)
    if (autoGenerate) {
      const PORT = process.env.PORT || 3000
      fetch(`http://localhost:${PORT}/api/v1/items/${id}/generate-media`, {
        method: 'POST',
        headers: { 'authorization': `Bearer ${INTERNAL_TOKEN}` },
      })
        .catch(err => app.log.warn({ err: err.message, id }, 'auto-generate falhou ao disparar'))
    }

    return item
  })

  // NOTA: POST /api/v1/items/:id/publish vive em routes/publish.js (real, Playwright)
}

function defaultTargets(type) {
  if (type === 'carousel') return ['instagram_feed']
  if (type === 'reel') return ['instagram_reel', 'tiktok']
  if (type === 'story') return ['instagram_story']
  return []
}
