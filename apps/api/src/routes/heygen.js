import * as hg from '../services/heygen.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const CRIADOS = path.join(ROOT, 'squads', 'live-social-media', 'output', 'criados')

export default async function heygenRoutes(app) {
  app.get('/api/v1/heygen/avatars', async (req, reply) => {
    try {
      const avatars = await hg.listAvatars()
      return avatars
    } catch (err) { reply.code(500); return { error: String(err.message || err) } }
  })

  app.get('/api/v1/heygen/voices', async (req, reply) => {
    try { return await hg.listVoices() }
    catch (err) { reply.code(500); return { error: String(err.message || err) } }
  })

  app.post('/api/v1/heygen/video', async (req, reply) => {
    const { avatarId, voiceId, text, name = `heygen-${Date.now()}.mp4` } = req.body || {}
    if (!avatarId || !text) { reply.code(400); return { error: 'avatarId e text obrigatórios' } }
    const outPath = path.join(CRIADOS, '_tests', name)
    try {
      const r = await hg.generateVideo({ avatarId, voiceId, text, outPath })
      return { ok: true, ...r, relPath: path.relative(CRIADOS, outPath).replace(/\\/g, '/') }
    } catch (err) { reply.code(500); return { error: String(err.message || err) } }
  })
}
