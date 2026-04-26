import * as os from '../services/instagramOS.js'

export default async function instagramOSRoutes(app) {
  const prefix = '/api/v1/instagram-os'

  // ── Config ─────────────────────────────────────────────────────────────
  app.get(`${prefix}/config`, async () => os.loadConfig())

  app.put(`${prefix}/config`, async (req, reply) => {
    const { username, competitors, emails } = req.body || {}
    if (!username) { reply.code(400); return { error: 'username obrigatório' } }
    if (!Array.isArray(competitors)) { reply.code(400); return { error: 'competitors deve ser array' } }
    if (!Array.isArray(emails)) { reply.code(400); return { error: 'emails deve ser array' } }
    await os.saveConfig({ username, competitors, emails })
    return { ok: true }
  })

  // ── Pipeline ────────────────────────────────────────────────────────────
  app.post(`${prefix}/run`, async (req, reply) => {
    try {
      await os.run(app.log)
      return { ok: true, message: 'Pipeline iniciado em background' }
    } catch (err) {
      reply.code(409)
      return { error: err.message }
    }
  })

  app.get(`${prefix}/status`, async () => os.getStatus())

  // ── Relatórios ──────────────────────────────────────────────────────────
  app.get(`${prefix}/reports`, async () => os.listReports())

  app.get(`${prefix}/report/html`, async (req, reply) => {
    const html = await os.getLatestReportHtml()
    if (!html) { reply.code(404); return { error: 'Nenhum relatório disponível' } }
    reply.type('text/html').send(html)
  })

  app.get(`${prefix}/report/data`, async (req, reply) => {
    const data = await os.getLatestReport()
    if (!data) { reply.code(404); return { error: 'Nenhum relatório disponível' } }
    return data
  })
}
