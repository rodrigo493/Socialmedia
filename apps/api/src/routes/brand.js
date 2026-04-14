// Edição das memórias de marca (company.md + preferences.md).
// Qualquer edição aqui vira contexto automático em todos os agentes.

import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const MEMORY = path.join(ROOT, '_opensquad', '_memory')
const ASSETS = path.join(MEMORY, 'assets')

const FILES = {
  company: 'company.md',
  preferences: 'preferences.md',
}

async function findLogo() {
  try {
    const files = await fs.readdir(ASSETS)
    return files.find(f => /^logo\.(png|jpg|jpeg|svg|webp)$/i.test(f)) || null
  } catch { return null }
}

export default async function brandRoutes(app) {
  app.get('/api/v1/brand/:name', async (req, reply) => {
    const name = req.params.name
    const file = FILES[name]
    if (!file) { reply.code(404); return { error: 'memória desconhecida' } }
    try {
      const content = await fs.readFile(path.join(MEMORY, file), 'utf8')
      return { name, file, content }
    } catch {
      return { name, file, content: '' }
    }
  })

  app.put('/api/v1/brand/:name', async (req, reply) => {
    const name = req.params.name
    const file = FILES[name]
    if (!file) { reply.code(404); return { error: 'memória desconhecida' } }
    const { content = '' } = req.body || {}
    await fs.mkdir(MEMORY, { recursive: true })
    await fs.writeFile(path.join(MEMORY, file), content)
    // limpa cache do responder para próxima chamada recarregar
    try {
      const mod = await import('../services/responder.js')
      if (mod._resetBrandCache) mod._resetBrandCache()
    } catch {}
    return { ok: true, name, file, bytes: content.length }
  })

  // Logo: GET stream + upload multipart
  app.get('/api/v1/brand/logo/image', async (req, reply) => {
    const name = await findLogo()
    if (!name) { reply.code(404); return reply.send({ error: 'sem logo' }) }
    const full = path.join(ASSETS, name)
    const ext = path.extname(name).toLowerCase().slice(1)
    const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', webp: 'image/webp' }[ext] || 'image/png'
    reply.header('content-type', mime)
    reply.header('cache-control', 'public, max-age=60')
    return reply.send(fsSync.createReadStream(full))
  })

  app.get('/api/v1/brand/logo', async () => {
    const name = await findLogo()
    return { hasLogo: !!name, file: name }
  })

  app.post('/api/v1/brand/logo', async (req, reply) => {
    const parts = req.parts()
    await fs.mkdir(ASSETS, { recursive: true })
    let saved = null
    for await (const part of parts) {
      if (part.type === 'file') {
        const ext = path.extname(part.filename).toLowerCase()
        if (!/\.(png|jpg|jpeg|svg|webp)$/i.test(ext)) continue
        // remove logo anterior
        for (const e of ['.png', '.jpg', '.jpeg', '.svg', '.webp']) {
          await fs.unlink(path.join(ASSETS, 'logo' + e)).catch(() => {})
        }
        const target = path.join(ASSETS, 'logo' + ext)
        await pipeline(part.file, fsSync.createWriteStream(target))
        saved = 'logo' + ext
      }
    }
    if (!saved) { reply.code(400); return { error: 'nenhum arquivo válido (png/jpg/svg/webp)' } }
    return { ok: true, file: saved }
  })

  app.delete('/api/v1/brand/logo', async () => {
    for (const e of ['.png', '.jpg', '.jpeg', '.svg', '.webp']) {
      await fs.unlink(path.join(ASSETS, 'logo' + e)).catch(() => {})
    }
    return { ok: true }
  })

  // Manual da marca — aceita múltiplos arquivos (PDF, imagens, qualquer coisa)
  const MANUAL_DIR = path.join(ASSETS, 'manual')
  app.get('/api/v1/brand/manual', async () => {
    try {
      const files = await fs.readdir(MANUAL_DIR)
      const list = []
      for (const f of files) {
        const stat = await fs.stat(path.join(MANUAL_DIR, f))
        list.push({ file: f, size: stat.size, modified: stat.mtime.toISOString() })
      }
      return list
    } catch { return [] }
  })

  app.get('/api/v1/brand/manual/:file', async (req, reply) => {
    const name = path.basename(req.params.file)
    const full = path.join(MANUAL_DIR, name)
    if (!fsSync.existsSync(full)) { reply.code(404); return { error: 'não encontrado' } }
    reply.header('content-disposition', `inline; filename="${name}"`)
    const ext = path.extname(name).toLowerCase()
    const mimes = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' }
    reply.header('content-type', mimes[ext] || 'application/octet-stream')
    return reply.send(fsSync.createReadStream(full))
  })

  app.post('/api/v1/brand/manual', async (req, reply) => {
    const parts = req.parts()
    await fs.mkdir(MANUAL_DIR, { recursive: true })
    const saved = []
    for await (const part of parts) {
      if (part.type === 'file') {
        // sanitiza nome
        const clean = part.filename.replace(/[^\w\s.-]/g, '').replace(/\s+/g, '-')
        const target = path.join(MANUAL_DIR, clean)
        await pipeline(part.file, fsSync.createWriteStream(target))
        saved.push(clean)
      }
    }
    return { ok: true, saved }
  })

  app.delete('/api/v1/brand/manual/:file', async (req, reply) => {
    const name = path.basename(req.params.file)
    await fs.unlink(path.join(MANUAL_DIR, name)).catch(() => {})
    return { ok: true }
  })
}
