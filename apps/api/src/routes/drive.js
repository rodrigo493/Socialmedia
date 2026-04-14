import * as drive from '../services/drive.js'

export default async function driveRoutes(app) {
  // Setup status — diz se está configurado e qual email compartilhar a pasta
  app.get('/api/v1/drive/status', async () => {
    const configured = drive.isConfigured()
    const email = await drive.getServiceAccountEmail()
    return {
      configured,
      serviceAccountEmail: email,
      rootFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || null,
      hint: configured
        ? 'Tudo pronto. Use /api/v1/drive/list'
        : 'Configure GOOGLE_SERVICE_ACCOUNT_JSON e GOOGLE_DRIVE_FOLDER_ID no .env.',
    }
  })

  app.get('/api/v1/drive/list', async (req, reply) => {
    if (!drive.isConfigured()) { reply.code(503); return { error: 'drive não configurado — ver /api/v1/drive/status' } }
    try {
      return await drive.list({ folderId: req.query.folderId, query: req.query.q })
    } catch (err) { reply.code(500); return { error: String(err.message || err) } }
  })

  app.get('/api/v1/drive/search', async (req, reply) => {
    if (!drive.isConfigured()) { reply.code(503); return { error: 'drive não configurado' } }
    const q = req.query.q
    if (!q) { reply.code(400); return { error: 'q obrigatório' } }
    try { return await drive.search(q) }
    catch (err) { reply.code(500); return { error: String(err.message || err) } }
  })

  // Download proxy — backend baixa do Drive e serve. Permite <img src=> no frontend.
  app.get('/api/v1/drive/file/:id', async (req, reply) => {
    if (!drive.isConfigured()) { reply.code(503); return }
    try {
      const meta = await drive.get(req.params.id)
      const buf = await drive.downloadToBuffer(req.params.id)
      reply.header('content-type', meta.mimeType || 'application/octet-stream')
      reply.header('content-disposition', `inline; filename="${meta.name}"`)
      return reply.send(buf)
    } catch (err) { reply.code(500); return { error: String(err.message || err) } }
  })

  // Upload para o Drive (via multipart do frontend)
  app.post('/api/v1/drive/upload', async (req, reply) => {
    if (!drive.isConfigured()) { reply.code(503); return { error: 'drive não configurado' } }
    try {
      const parts = req.parts()
      const uploaded = []
      let parentId = null
      for await (const part of parts) {
        if (part.type === 'field' && part.fieldname === 'parentId') parentId = part.value
        if (part.type === 'file') {
          const chunks = []
          for await (const c of part.file) chunks.push(c)
          const buffer = Buffer.concat(chunks)
          const result = await drive.upload({
            name: part.filename, mime: part.mimetype, buffer, parentId,
          })
          uploaded.push(result)
        }
      }
      return { ok: true, uploaded }
    } catch (err) { reply.code(500); return { error: String(err.message || err) } }
  })

  app.post('/api/v1/drive/folder', async (req, reply) => {
    if (!drive.isConfigured()) { reply.code(503); return { error: 'drive não configurado' } }
    const { name, parentId } = req.body || {}
    if (!name) { reply.code(400); return { error: 'name obrigatório' } }
    try { return await drive.createFolder(name, parentId) }
    catch (err) { reply.code(500); return { error: String(err.message || err) } }
  })
}
