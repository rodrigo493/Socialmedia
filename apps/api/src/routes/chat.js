import { AGENTS, route } from '../services/agents.js'
import { respond } from '../services/responder.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const SESSIONS_DIR = path.join(ROOT, 'squads', 'live-social-media', 'output', 'chat-sessions')

async function loadSession(id) {
  try {
    const raw = await fs.readFile(path.join(SESSIONS_DIR, `${id}.json`), 'utf8')
    return JSON.parse(raw)
  } catch { return null }
}

async function saveSession(session) {
  await fs.mkdir(SESSIONS_DIR, { recursive: true })
  await fs.writeFile(path.join(SESSIONS_DIR, `${session.id}.json`), JSON.stringify(session, null, 2))
}

function shortTitle(text) {
  if (!text) return 'Nova conversa'
  return text.slice(0, 60).replace(/\n/g, ' ')
}

export default async function chatRoutes(app) {
  app.get('/api/v1/agents', async () =>
    AGENTS.map(a => ({ id: a.id, icon: a.icon, role: a.role }))
  )

  // Lista sessões — mais recentes primeiro
  app.get('/api/v1/chat/sessions', async () => {
    try {
      const files = await fs.readdir(SESSIONS_DIR)
      const sessions = []
      for (const f of files) {
        if (!f.endsWith('.json')) continue
        try {
          const raw = await fs.readFile(path.join(SESSIONS_DIR, f), 'utf8')
          const s = JSON.parse(raw)
          sessions.push({
            id: s.id, title: s.title, createdAt: s.createdAt, updatedAt: s.updatedAt,
            messageCount: s.messages?.length || 0,
            lastAgent: s.messages?.filter(m => m.role === 'agent').slice(-1)[0]?.agent?.id || null,
          })
        } catch {}
      }
      sessions.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      return sessions
    } catch { return [] }
  })

  app.get('/api/v1/chat/sessions/:id', async (req, reply) => {
    const s = await loadSession(req.params.id)
    if (!s) { reply.code(404); return { error: 'sessão não encontrada' } }
    return s
  })

  app.delete('/api/v1/chat/sessions/:id', async (req) => {
    await fs.unlink(path.join(SESSIONS_DIR, `${req.params.id}.json`)).catch(() => {})
    return { ok: true }
  })

  app.post('/api/v1/chat', async (req, reply) => {
    const { message, history = [], forceAgent, attachments = [], sessionId } = req.body || {}
    if (!message || typeof message !== 'string') {
      reply.code(400); return { error: 'message (string) obrigatório' }
    }
    const { primary, supporters } = route(message)
    const agent = forceAgent ? AGENTS.find(a => a.id === forceAgent) || primary : primary

    try {
      const { text, draft } = await respond({ agent, message, history, attachments })
      const now = new Date().toISOString()

      // Persiste/atualiza sessão
      let session = sessionId ? await loadSession(sessionId) : null
      if (!session) {
        session = {
          id: 'sess-' + Date.now().toString(36),
          title: shortTitle(message),
          createdAt: now, updatedAt: now, messages: [],
        }
      }
      session.messages.push({ role: 'user', text: message, at: now, attachments })
      session.messages.push({
        role: 'agent', at: now,
        agent: { id: agent.id, icon: agent.icon, role: agent.role },
        supporters: supporters.map(s => ({ id: s.id, icon: s.icon, role: s.role })),
        text, draft,
      })
      session.updatedAt = now
      await saveSession(session)

      return {
        agent: { id: agent.id, icon: agent.icon, role: agent.role },
        supporters: supporters.map(s => ({ id: s.id, icon: s.icon, role: s.role })),
        text, draft, at: now,
        sessionId: session.id,
      }
    } catch (err) {
      app.log.error(err)
      reply.code(500)
      return { error: String(err.message || err) }
    }
  })
}
