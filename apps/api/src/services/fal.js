// Fal.ai client genérico (queue-based API).
// https://docs.fal.ai/model-endpoints/queue

import fs from 'node:fs/promises'
import path from 'node:path'

const KEY = process.env.FAL_KEY

function authHeader() {
  if (!KEY) throw new Error('FAL_KEY faltando no .env')
  return 'Key ' + KEY
}

// Submete job, faz polling, retorna result
export async function run(modelId, input, { pollMs = 3000, timeoutMs = 10 * 60 * 1000 } = {}) {
  const submit = await fetch(`https://queue.fal.run/${modelId}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: authHeader() },
    body: JSON.stringify(input),
  })
  if (!submit.ok) throw new Error(`Fal submit ${submit.status}: ${await submit.text()}`)
  const { request_id } = await submit.json()
  if (!request_id) throw new Error('Fal submit sem request_id')

  const statusUrl = `https://queue.fal.run/${modelId}/requests/${request_id}/status`
  const resultUrl = `https://queue.fal.run/${modelId}/requests/${request_id}`
  const start = Date.now()

  while (true) {
    if (Date.now() - start > timeoutMs) throw new Error('Fal timeout')
    const s = await fetch(statusUrl, { headers: { Authorization: authHeader() } })
    if (!s.ok) throw new Error(`Fal status ${s.status}: ${await s.text()}`)
    const st = await s.json()
    if (st.status === 'COMPLETED') {
      const r = await fetch(resultUrl, { headers: { Authorization: authHeader() } })
      return r.json()
    }
    if (st.status === 'FAILED' || st.status === 'ERROR') {
      throw new Error('Fal falhou: ' + JSON.stringify(st))
    }
    await new Promise(r => setTimeout(r, pollMs))
  }
}

// Upload de arquivo local para o storage Fal → devolve URL https pública
export async function uploadFile(filePath) {
  const data = await fs.readFile(filePath)
  const name = path.basename(filePath)
  const mime = guessMime(name)

  // 1) initiate
  const initRes = await fetch('https://rest.alpha.fal.ai/storage/upload/initiate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: authHeader() },
    body: JSON.stringify({ file_name: name, content_type: mime }),
  })
  if (!initRes.ok) throw new Error(`Fal upload initiate: ${initRes.status} ${await initRes.text()}`)
  const { upload_url, file_url } = await initRes.json()

  // 2) PUT bytes
  const putRes = await fetch(upload_url, { method: 'PUT', headers: { 'content-type': mime }, body: data })
  if (!putRes.ok) throw new Error(`Fal upload PUT: ${putRes.status}`)

  return file_url
}

function guessMime(name) {
  const ext = path.extname(name).toLowerCase()
  return {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.webp': 'image/webp', '.mp4': 'video/mp4', '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
  }[ext] || 'application/octet-stream'
}

// Download de URL → arquivo local
export async function downloadTo(url, outPath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download ${url} failed ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, buf)
  return { path: outPath, bytes: buf.length }
}
