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
    if (!req.user) { reply.code(401); return { error: 'não autenticado' } }
    return req.user
  })

  // Admin-only: listar/criar/deletar usuários (middleware global já exige auth)
  app.get('/api/v1/auth/users', async () => {
    return await auth.listUsers()
  })

  app.post('/api/v1/auth/users', async (req, reply) => {
    const { username, password } = req.body || {}
    if (!username || !password) { reply.code(400); return { error: 'username e password obrigatórios' } }
    try {
      return await auth.createUser({ username, password })
    } catch (err) { reply.code(400); return { error: err.message } }
  })

  app.delete('/api/v1/auth/users/:username', async (req, reply) => {
    const r = await auth.deleteUser(req.params.username)
    if (!r.ok) { reply.code(400); return r }
    return r
  })
}
