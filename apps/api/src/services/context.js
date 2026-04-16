// Carrega contexto de marca + análise consolidada de concorrentes/perfil.
// Usado pelos prompts de imagem/vídeo para gerar conteúdo alinhado.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')

const COMPANY_MD = path.join(ROOT, '_opensquad', '_memory', 'company.md')
const CONSOLIDATED = path.join(ROOT, 'squads', 'live-social-media', '_investigations', 'consolidated-analysis.md')

let _cache = null
let _cacheAt = 0
const TTL_MS = 60 * 1000

async function readIfExists(p, maxChars) {
  try {
    const raw = await fs.readFile(p, 'utf8')
    return maxChars ? raw.slice(0, maxChars) : raw
  } catch { return null }
}

export async function loadBrandContext() {
  if (_cache && Date.now() - _cacheAt < TTL_MS) return _cache
  const [company, consolidated] = await Promise.all([
    readIfExists(COMPANY_MD, 8000),
    readIfExists(CONSOLIDATED, 12000),
  ])
  _cache = { company, consolidated, hasAny: !!(company || consolidated) }
  _cacheAt = Date.now()
  return _cache
}

// Retorna um bloco curto pra injetar em prompts visuais (imagem/vídeo).
// Foco em estética, paleta, tom — não conteúdo textual.
export async function visualBriefBlock() {
  const ctx = await loadBrandContext()
  if (!ctx.hasAny) return ''
  const parts = []
  if (ctx.company) parts.push(`CONTEXTO DA MARCA:\n${ctx.company.slice(0, 2000)}`)
  if (ctx.consolidated) parts.push(`REFERÊNCIAS DOS CONCORRENTES E PERFIL PRÓPRIO (estética, padrões visuais a seguir/evitar):\n${ctx.consolidated.slice(0, 3000)}`)
  return parts.join('\n\n')
}
