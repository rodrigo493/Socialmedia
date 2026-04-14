import fs from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const PRODUCTS = path.join(ROOT, 'squads', 'live-social-media', '_products')
const UPLOADS = path.join(ROOT, 'squads', 'live-social-media', 'output', '_uploads')

function slugify(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

async function safeJoin(base, p) {
  const full = path.resolve(base, p)
  if (!full.startsWith(path.resolve(base))) throw new Error('path traversal')
  return full
}

export default async function productsRoutes(app) {
  // Lista produtos
  app.get('/api/v1/products', async () => {
    await fs.mkdir(PRODUCTS, { recursive: true })
    const entries = await fs.readdir(PRODUCTS, { withFileTypes: true })
    const out = []
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith('_')) continue
      try {
        const raw = await fs.readFile(path.join(PRODUCTS, e.name, 'catalog.json'), 'utf8')
        out.push({ slug: e.name, ...JSON.parse(raw) })
      } catch {
        out.push({ slug: e.name, name: e.name, incomplete: true })
      }
    }
    return out
  })

  // Detalhe de um produto + lista de arquivos na pasta
  app.get('/api/v1/products/:slug', async (req, reply) => {
    const slug = slugify(req.params.slug)
    const dir = await safeJoin(PRODUCTS, slug)
    try {
      const files = await fs.readdir(dir)
      let catalog = {}
      try {
        catalog = JSON.parse(await fs.readFile(path.join(dir, 'catalog.json'), 'utf8'))
      } catch {}
      return { slug, files, catalog }
    } catch {
      reply.code(404); return { error: 'produto não encontrado' }
    }
  })

  // Cria/atualiza catalog.json
  app.post('/api/v1/products/:slug', async (req, reply) => {
    const slug = slugify(req.params.slug)
    const dir = await safeJoin(PRODUCTS, slug)
    await fs.mkdir(dir, { recursive: true })
    const catalog = { slug, ...req.body }
    await fs.writeFile(path.join(dir, 'catalog.json'), JSON.stringify(catalog, null, 2))
    return catalog
  })

  // Upload multipart de arquivos — target=products:<slug> salva em _products/<slug>/
  // target=chat salva em output/_uploads/ (para anexos do chat)
  app.post('/api/v1/uploads', async (req, reply) => {
    const parts = req.parts()
    const uploaded = []
    let target = 'chat'
    let slug = null

    for await (const part of parts) {
      if (part.type === 'field') {
        if (part.fieldname === 'target') target = part.value
        if (part.fieldname === 'slug') slug = slugify(part.value)
      } else if (part.type === 'file') {
        let destDir
        if (target.startsWith('products')) {
          if (!slug) { reply.code(400); return { error: 'slug obrigatório para target=products' } }
          destDir = await safeJoin(PRODUCTS, slug)
        } else {
          destDir = UPLOADS
        }
        await fs.mkdir(destDir, { recursive: true })
        const safeName = slugify(part.filename.replace(/\.[^.]+$/, '')) + path.extname(part.filename).toLowerCase()
        const outPath = path.join(destDir, safeName)
        await pipeline(part.file, (await import('node:fs')).createWriteStream(outPath))
        uploaded.push({
          original: part.filename,
          saved: safeName,
          path: path.relative(ROOT, outPath).replace(/\\/g, '/'),
          target, slug,
        })
      }
    }
    return { ok: true, uploaded }
  })
}
