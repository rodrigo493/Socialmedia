import * as instagram from '../publishers/instagram.js'
import * as tiktok from '../publishers/tiktok.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const CRIADOS = path.join(ROOT, 'squads', 'live-social-media', 'output', 'criados')

// Fila single-thread — Playwright reusa um profile, dois posts simultâneos
// dão Chromium lock. Serializamos com uma Promise encadeada.
let queue = Promise.resolve()
function enqueue(fn) {
  const next = queue.then(fn, fn)
  queue = next.catch(() => {})
  return next
}

async function loadItem(id) {
  const file = path.join(CRIADOS, `${id}.item.json`)
  const raw = await fs.readFile(file, 'utf8')
  return { item: JSON.parse(raw), file }
}

async function saveItem(file, item) {
  await fs.writeFile(file, JSON.stringify(item, null, 2))
}

export default async function publishRoutes(app) {
  // Login manual do Instagram — abre janela headed
  app.post('/api/v1/publishers/instagram/login', async () => {
    await instagram.login()
    return { ok: true, message: 'Fluxo de login Instagram concluído.' }
  })

  app.post('/api/v1/publishers/tiktok/login', async () => {
    await tiktok.login()
    return { ok: true, message: 'Fluxo de login TikTok concluído.' }
  })

  // Publica um item — só Instagram feed por ora
  app.post('/api/v1/items/:id/publish', async (req, reply) => {
    const { targets = [] } = req.body || {}
    let data
    try {
      data = await loadItem(req.params.id)
    } catch {
      reply.code(404); return { error: 'item não encontrado' }
    }
    const { item, file } = data

    const job = enqueue(async () => {
      const results = []

      if (targets.includes('instagram_feed')) {
        const images = (item.media || []).filter(m => m.role === 'slide' || !m.role).map(m => path.join(CRIADOS, m.path))
        if (images.length === 0) throw new Error('item sem imagens para instagram_feed')
        results.push(await instagram.publishFeed({ images, caption: item.caption }))
      }

      if (targets.includes('tiktok')) {
        const video = (item.media || []).find(m => m.role === 'video')
        if (!video) throw new Error('item sem vídeo (media.role=video) para tiktok')
        results.push(await tiktok.publishVideo({ videoPath: path.join(CRIADOS, video.path), caption: item.caption }))
      }

      if (results.length === 0) throw new Error('Nenhum target suportado em ' + JSON.stringify(targets))

      item.status = 'posted'
      item.postedAt = new Date().toISOString()
      item.postedTo = results.map(r => r.platform)
      item.publishResults = results
      await saveItem(file, item)
      return results
    })

    try {
      const results = await job
      return { status: 'success', results, item }
    } catch (err) {
      app.log.error(err)
      reply.code(500)
      return { error: String(err.message || err) }
    }
  })
}
