import * as a from '../services/analytics.js'

export default async function analyticsRoutes(app) {
  app.get('/api/v1/analytics', async () => {
    return { items: await a.listItemsWithMetrics() }
  })

  app.get('/api/v1/analytics/:itemId', async (req) => {
    return { itemId: req.params.itemId, timeline: await a.getTimeline(req.params.itemId) }
  })

  app.post('/api/v1/analytics/:itemId/capture', async (req, reply) => {
    try { return await a.captureForItem(req.params.itemId) }
    catch (err) { reply.code(500); return { error: String(err.message || err) } }
  })

  app.post('/api/v1/analytics/:itemId/url', async (req, reply) => {
    const { url, platform } = req.body || {}
    if (!url) { reply.code(400); return { error: 'url obrigatória' } }
    try { return { ok: true, item: await a.setItemUrl(req.params.itemId, { url, platform }) } }
    catch (err) { reply.code(500); return { error: String(err.message || err) } }
  })

  app.post('/api/v1/analytics/fetch', async (req, reply) => {
    const { url } = req.body || {}
    if (!url) { reply.code(400); return { error: 'url obrigatória' } }
    try { return await a.fetchMetrics(url) }
    catch (err) { reply.code(500); return { error: String(err.message || err) } }
  })
}
