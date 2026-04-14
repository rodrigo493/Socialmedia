// Exportação: streaming ZIP de qualquer parte do projeto.
// Rotas:
//   GET /api/v1/export/item/:id              → ZIP de um item (pasta + .item.json)
//   GET /api/v1/export/criados               → ZIP de toda a pasta criados/
//   GET /api/v1/export/products              → ZIP de todo catálogo + fotos
//   GET /api/v1/export/reports               → ZIP de todos os .report.json
//   GET /api/v1/export/investigations        → ZIP de todas as investigações
//   GET /api/v1/export/brand                 → ZIP de company.md + preferences.md
//   GET /api/v1/export/backup                → ZIP completo (tudo acima)
//   GET /api/v1/export/file?path=...         → stream de arquivo único (download direto)

import archiver from 'archiver'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const SQUAD = path.join(ROOT, 'squads', 'live-social-media')
const OUTPUT = path.join(SQUAD, 'output')
const CRIADOS = path.join(OUTPUT, 'criados')
const PRODUCTS = path.join(SQUAD, '_products')
const INVESTIGATIONS = path.join(SQUAD, '_investigations')
const MEMORY = path.join(ROOT, '_opensquad', '_memory')

function streamZip(reply, filename, build) {
  reply.header('content-type', 'application/zip')
  reply.header('content-disposition', `attachment; filename="${filename}"`)
  const archive = archiver('zip', { zlib: { level: 6 } })
  archive.on('error', err => reply.raw.destroy(err))
  reply.raw.on('close', () => { try { archive.destroy() } catch {} })
  archive.pipe(reply.raw)
  build(archive)
  archive.finalize()
  return reply
}

async function existsDir(p) {
  try { const s = await fsp.stat(p); return s.isDirectory() } catch { return false }
}

export default async function exportRoutes(app) {
  // Listagem pra UI
  app.get('/api/v1/export/summary', async () => {
    const list = async (dir, filter = () => true) => {
      try {
        return (await fsp.readdir(dir)).filter(filter).length
      } catch { return 0 }
    }
    return {
      criados: await list(CRIADOS, n => n.endsWith('.item.json')),
      products: await list(PRODUCTS, n => !n.startsWith('_')),
      reports: await list(OUTPUT, n => n.endsWith('.report.json')),
      investigations: await list(INVESTIGATIONS, n => !n.startsWith('.')),
    }
  })

  app.get('/api/v1/export/item/:id', async (req, reply) => {
    const id = req.params.id
    const jsonPath = path.join(CRIADOS, `${id}.item.json`)
    const itemDir = path.join(CRIADOS, id)
    if (!fs.existsSync(jsonPath)) { reply.code(404); return { error: 'item não encontrado' } }
    return streamZip(reply, `${id}.zip`, archive => {
      archive.file(jsonPath, { name: `${id}.item.json` })
      if (fs.existsSync(itemDir)) archive.directory(itemDir, id)
    })
  })

  app.get('/api/v1/export/criados', async (req, reply) => {
    if (!fs.existsSync(CRIADOS)) { reply.code(404); return { error: 'pasta criados/ vazia' } }
    return streamZip(reply, `criados-${stamp()}.zip`, archive => archive.directory(CRIADOS, 'criados'))
  })

  app.get('/api/v1/export/products', async (req, reply) => {
    if (!(await existsDir(PRODUCTS))) { reply.code(404); return { error: 'sem produtos' } }
    return streamZip(reply, `produtos-${stamp()}.zip`, archive => archive.directory(PRODUCTS, '_products'))
  })

  app.get('/api/v1/export/reports', async (req, reply) => {
    return streamZip(reply, `relatorios-${stamp()}.zip`, archive => {
      archive.glob('*.report.json', { cwd: OUTPUT })
    })
  })

  app.get('/api/v1/export/investigations', async (req, reply) => {
    if (!(await existsDir(INVESTIGATIONS))) { reply.code(404); return { error: 'sem investigações' } }
    return streamZip(reply, `investigacoes-${stamp()}.zip`, archive => archive.directory(INVESTIGATIONS, '_investigations'))
  })

  app.get('/api/v1/export/brand', async (req, reply) => {
    if (!(await existsDir(MEMORY))) { reply.code(404); return { error: 'sem memória de marca' } }
    return streamZip(reply, `marca-${stamp()}.zip`, archive => archive.directory(MEMORY, 'memory'))
  })

  // Backup completo — todos os acima
  app.get('/api/v1/export/backup', async (req, reply) => {
    return streamZip(reply, `live-social-backup-${stamp()}.zip`, archive => {
      if (fs.existsSync(CRIADOS)) archive.directory(CRIADOS, 'criados')
      if (fs.existsSync(PRODUCTS)) archive.directory(PRODUCTS, '_products')
      if (fs.existsSync(INVESTIGATIONS)) archive.directory(INVESTIGATIONS, '_investigations')
      if (fs.existsSync(MEMORY)) archive.directory(MEMORY, 'memory')
      archive.glob('*.report.json', { cwd: OUTPUT })
    })
  })

  // Download de arquivo único via path relativo ao ROOT
  app.get('/api/v1/export/file', async (req, reply) => {
    const rel = (req.query.path || '').toString()
    if (!rel) { reply.code(400); return { error: 'path obrigatório' } }
    const abs = path.resolve(ROOT, rel)
    if (!abs.startsWith(ROOT)) { reply.code(400); return { error: 'path traversal' } }
    if (!fs.existsSync(abs)) { reply.code(404); return { error: 'não encontrado' } }
    const stat = await fsp.stat(abs)
    if (stat.isDirectory()) { reply.code(400); return { error: 'é diretório (use /export/* específico)' } }
    reply.header('content-disposition', `attachment; filename="${path.basename(abs)}"`)
    return reply.send(fs.createReadStream(abs))
  })
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}
