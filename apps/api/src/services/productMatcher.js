// Localiza imagens de produtos para usar como referencia na geracao de midia.
// Produtos vivem em squads/live-social-media/_products/<slug>/ com:
//   - catalog.json (opcional): { name, aliases?, keywords?, primaryImage? }
//   - imagens .jpg/.jpeg/.png/.webp

import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const PRODUCTS = path.join(ROOT, 'squads', 'live-social-media', '_products')

const IMG_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

function normalize(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

function deslug(slug) {
  return (slug || '').replace(/[-_]+/g, ' ').trim()
}

let _cache = null
let _cacheAt = 0
const TTL_MS = 30 * 1000

async function listProducts() {
  if (_cache && Date.now() - _cacheAt < TTL_MS) return _cache
  const out = []
  try {
    const entries = await fs.readdir(PRODUCTS, { withFileTypes: true })
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith('_')) continue
      const dir = path.join(PRODUCTS, e.name)
      let catalog = {}
      try { catalog = JSON.parse(await fs.readFile(path.join(dir, 'catalog.json'), 'utf8')) } catch {}
      const files = await fs.readdir(dir)
      const images = files.filter(f => IMG_EXTS.has(path.extname(f).toLowerCase()))
      if (!images.length) continue
      const primary = catalog.primaryImage && images.includes(catalog.primaryImage)
        ? catalog.primaryImage
        : images[0]
      // termos para matching
      const terms = new Set()
      ;[catalog.name, deslug(e.name), ...(catalog.aliases || []), ...(catalog.keywords || [])]
        .filter(Boolean).forEach(t => {
          const n = normalize(t)
          if (n) terms.add(n)
        })
      out.push({
        slug: e.name,
        name: catalog.name || deslug(e.name),
        primaryImagePath: path.join(dir, primary),
        primaryImageRel: `${e.name}/${primary}`,
        terms: Array.from(terms),
      })
    }
  } catch {}
  _cache = out
  _cacheAt = Date.now()
  return out
}

export async function listAll() {
  return await listProducts()
}

// Recebe um item e devolve produtos referenciados.
// Se item.productSlugs e array (mesmo vazio): usa explicitamente.
//   - [] = usuario desabilitou auto-deteccao (sem referencia)
//   - ['slug-a'] = forca esses
// Se item.productSlugs e undefined: auto-detecta por keywords no titulo+caption.
export async function resolveForItem(item) {
  const all = await listProducts()
  if (!all.length) return { products: [], source: 'no-products' }

  if (Array.isArray(item.productSlugs)) {
    if (!item.productSlugs.length) return { products: [], source: 'manual-empty' }
    const picked = all.filter(p => item.productSlugs.includes(p.slug))
    return { products: picked, source: 'manual' }
  }

  // Auto: matching por substring nos termos
  const haystack = normalize([item.title, item.caption, item.script, item.voiceText, item.topic].filter(Boolean).join(' '))
  if (!haystack) return { products: [], source: 'auto-empty' }
  const scored = all.map(p => {
    let score = 0
    for (const t of p.terms) {
      if (t.length < 2) continue
      if (haystack.includes(t)) score += t.length
    }
    return { p, score }
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score)
  return { products: scored.slice(0, 2).map(x => x.p), source: scored.length ? 'auto' : 'auto-empty' }
}
