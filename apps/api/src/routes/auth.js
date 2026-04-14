import * as auth from '../services/auth.js'

export default async function authRoutes(app) {
  app.get('/api/v1/auth/status', async () => ({
    configured: await auth.isConfigured(),
  }))

  // Setup inicial — só funciona se ainda não tem user configurado
  app.post('/api/v1/auth/setup', async (req, reply) => {
    if (await auth.isConfigured()) {
      reply.code(409); return { error: 'já configurado — use /auth/login' }
    }
    const { username, password } = req.body || {}
    try {
      const r = await auth.createUser({ username, password })
      const tok = await auth.login({ username, password })
      return { ...r, token: tok.token }
    } catch (err) { reply.code(400); return { error: err.message } }
  })

  app.post('/api/v1/auth/login', async (req, reply) => {
    const { username, password } = req.body || {}
    const r = await auth.login({ username, password })
    if (!r) { reply.code(401); return { error: 'credenciais inválidas' } }
    return r
  })

  app.get('/api/v1/auth/me', async (req, reply) => {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) { reply.code(401); return { error: 'não autenticado' } }
    const u = await auth.verifyToken(token)
    if (!u) { reply.code(401); return { error: 'token inválido' } }
    return u
  })
}
