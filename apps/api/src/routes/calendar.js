import * as cal from '../services/calendar.js'

export default async function calendarRoutes(app) {
  app.get('/api/v1/calendar/status', async () => ({
    configured: cal.isConfigured(),
    calendarId: process.env.GOOGLE_CALENDAR_ID || null,
    hint: cal.isConfigured()
      ? 'ok'
      : 'Setup: (1) habilite Google Calendar API no mesmo projeto da service account; (2) crie um calendário "Live Social · Editorial" no Google Calendar; (3) compartilhe com o e-mail da service account (permissão: fazer alterações em eventos); (4) pegue o ID do calendário em Configurações > Configurações e compartilhamento > Integrar calendário; (5) adicione GOOGLE_CALENDAR_ID no .env.',
  }))

  app.get('/api/v1/calendar/events', async (req, reply) => {
    if (!cal.isConfigured()) { reply.code(503); return { error: 'calendar não configurado' } }
    try { return await cal.list({ timeMin: req.query.from, timeMax: req.query.to }) }
    catch (err) { reply.code(500); return { error: String(err.message || err) } }
  })

  app.post('/api/v1/calendar/events', async (req, reply) => {
    if (!cal.isConfigured()) { reply.code(503); return { error: 'calendar não configurado' } }
    const { title, description, startAt, endAt, itemId, networks, status } = req.body || {}
    if (!title || !startAt) { reply.code(400); return { error: 'title e startAt obrigatórios' } }
    try { return await cal.create({ title, description, startAt, endAt, itemId, networks, status }) }
    catch (err) { reply.code(500); return { error: String(err.message || err) } }
  })

  app.patch('/api/v1/calendar/events/:id', async (req, reply) => {
    if (!cal.isConfigured()) { reply.code(503); return { error: 'calendar não configurado' } }
    try { return await cal.update(req.params.id, req.body || {}) }
    catch (err) { reply.code(500); return { error: String(err.message || err) } }
  })

  app.delete('/api/v1/calendar/events/:id', async (req, reply) => {
    if (!cal.isConfigured()) { reply.code(503); return { error: 'calendar não configurado' } }
    try { return await cal.remove(req.params.id) }
    catch (err) { reply.code(500); return { error: String(err.message || err) } }
  })
}
