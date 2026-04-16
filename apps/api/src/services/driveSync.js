// Sincroniza pastas/arquivos do Google Drive com _products/.
// Cada subpasta da pasta-raiz vira um produto. Cada imagem dentro vira
// referencia visual usada pelo productMatcher na geracao de midia.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as drive from './drive.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const PRODUCTS = path.join(ROOT, 'squads', 'live-social-media', '_products')

const FOLDER_MIME = 'application/vnd.google-apps.folder'
const IMG_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const IMG_EXTS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }

function slugify(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

// Sincroniza uma vez. Retorna resumo: produtos criados/atualizados, arquivos baixados.
export async function syncOnce({ log } = {}) {
  if (!drive.isConfigured()) {
    return { ok: false, error: 'Drive nao configurado (GOOGLE_SERVICE_ACCOUNT_JSON / GOOGLE_DRIVE_FOLDER_ID)' }
  }

  await fs.mkdir(PRODUCTS, { recursive: true })

  // 1) lista subpastas da raiz (cada uma = produto)
  const rootEntries = await drive.list({})
  const subfolders = rootEntries.filter(f => f.mimeType === FOLDER_MIME)

  const summary = { products: [], totalDownloaded: 0, totalSkipped: 0 }

  for (const folder of subfolders) {
    const slug = slugify(folder.name)
    if (!slug) continue
    // Convencao: pastas que comecam com _ sao ignoradas (ex: _RASCUNHOS)
    if (folder.name.startsWith('_')) continue

    // 2) lista arquivos de imagem dentro da subpasta
    const files = await drive.list({ folderId: folder.id })
    const images = files.filter(f => IMG_MIMES.has(f.mimeType))

    // Pasta sem imagens (ex: pasta so com videos) — ignora, nao cria produto fantasma
    if (!images.length) continue

    const productDir = path.join(PRODUCTS, slug)
    await fs.mkdir(productDir, { recursive: true })

    let downloaded = 0
    let skipped = 0
    const driveFileMap = {}

    for (const img of images) {
      const ext = path.extname(img.name).toLowerCase() || IMG_EXTS[img.mimeType] || '.jpg'
      const safeName = slugify(img.name.replace(/\.[^.]+$/, '')) + ext
      const destPath = path.join(productDir, safeName)

      driveFileMap[safeName] = { driveId: img.id, modifiedTime: img.modifiedTime }

      // Pula se ja existe e nao foi modificado depois (mtime)
      try {
        const stat = await fs.stat(destPath)
        if (img.modifiedTime && new Date(img.modifiedTime).getTime() <= stat.mtimeMs) {
          skipped++
          continue
        }
      } catch {}

      try {
        const buf = await drive.downloadToBuffer(img.id)
        await fs.writeFile(destPath, buf)
        downloaded++
      } catch (err) {
        log?.warn({ err: err.message, file: img.name, slug }, 'driveSync: falha ao baixar')
      }
    }

    // 3) atualiza catalog.json (preserva campos existentes que o usuario possa ter editado)
    const catalogPath = path.join(productDir, 'catalog.json')
    let existing = {}
    try { existing = JSON.parse(await fs.readFile(catalogPath, 'utf8')) } catch {}
    const catalog = {
      ...existing,
      slug,
      name: existing.name || folder.name,
      driveFolderId: folder.id,
      driveFileMap,
      syncedAt: new Date().toISOString(),
    }
    if (!existing.primaryImage && Object.keys(driveFileMap).length) {
      catalog.primaryImage = Object.keys(driveFileMap)[0]
    }
    await fs.writeFile(catalogPath, JSON.stringify(catalog, null, 2))

    summary.products.push({ slug, name: catalog.name, downloaded, skipped, total: images.length })
    summary.totalDownloaded += downloaded
    summary.totalSkipped += skipped
  }

  log?.info({ summary }, 'driveSync: concluido')
  return { ok: true, ...summary }
}
