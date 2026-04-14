// Gera squads/live-social-media/output/<YYYY-MM-DD>.report.json a partir do
// arquivo de dados do frontend (src/data/report.js). Útil enquanto o agente
// iris-influencer ainda não está integrado — permite desenvolver o painel com
// um report.json real no disco.
//
// Uso: node apps/api/scripts/seed-report.js

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..')
const OUT_DIR = path.join(ROOT, 'squads', 'live-social-media', 'output')
const SOURCE = path.join(ROOT, 'web', 'src', 'data', 'report.js')

const mod = await import(pathToFileURL(SOURCE).href)
const r = mod.report

// adiciona sources em meta (puxado das investigations existentes)
const INV = path.join(ROOT, 'squads', 'live-social-media', '_investigations')
const invEntries = await fs.readdir(INV, { withFileTypes: true }).catch(() => [])
r.meta.sources = invEntries.filter(e => e.isDirectory()).map(e => `@${e.name}`)

await fs.mkdir(OUT_DIR, { recursive: true })
const file = path.join(OUT_DIR, `${r.meta.date}.report.json`)
await fs.writeFile(file, JSON.stringify(r, null, 2))
console.log('wrote', file)
