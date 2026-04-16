// Veo 3 via Google AI Studio (Gemini API).
// Fluxo: submit (long-running) -> polling -> download do mp4.

import fs from 'node:fs/promises'
import path from 'node:path'

const KEY = process.env.GOOGLE_AI_STUDIO_KEY
// Modelos disponíveis: veo-3.0-fast-generate-001 · veo-3.0-generate-001 ·
// veo-3.1-fast-generate-preview · veo-3.1-generate-preview · veo-3.1-lite-generate-preview
const MODEL = process.env.VEO_MODEL || 'veo-3.1-generate-preview'
const BASE = 'https://generativelanguage.googleapis.com/v1beta'

async function gfetch(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY, ...(init.headers || {}) },
  })
  if (!res.ok) throw new Error(`Veo HTTP ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function generateVideo({ prompt, outPath, aspectRatio = '9:16', pollMs = 10000, timeoutMs = 6 * 60 * 1000, referenceImagePath }) {
  if (!KEY) throw new Error('GOOGLE_AI_STUDIO_KEY faltando no .env')

  const instance = { prompt }
  if (referenceImagePath) {
    const buf = await fs.readFile(referenceImagePath)
    const ext = path.extname(referenceImagePath).toLowerCase()
    const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[ext] || 'image/png'
    instance.image = { bytesBase64Encoded: buf.toString('base64'), mimeType: mime }
  }

  // 1) submit
  const submit = await gfetch(`${BASE}/models/${MODEL}:predictLongRunning`, {
    method: 'POST',
    body: JSON.stringify({
      instances: [instance],
      parameters: { aspectRatio },
    }),
  })
  const opName = submit.name
  if (!opName) throw new Error('Submit sem operation name: ' + JSON.stringify(submit).slice(0, 500))

  // 2) polling
  const start = Date.now()
  let op = submit
  while (!op.done) {
    if (Date.now() - start > timeoutMs) throw new Error('Veo timeout (>6min)')
    await new Promise(r => setTimeout(r, pollMs))
    op = await gfetch(`${BASE}/${opName}`)
  }
  if (op.error) throw new Error('Veo error: ' + JSON.stringify(op.error))

  // 3) download
  const gvr = op.response?.generateVideoResponse
  const videos = gvr?.generatedSamples || op.response?.videos || []
  const first = videos[0]
  const fileUri = first?.video?.uri || first?.uri
  if (!fileUri) {
    // Caso comum: filtro RAI bloqueou o video (audio ofensivo, conteudo sensivel, etc.)
    if (gvr?.raiMediaFilteredCount > 0) {
      const reasons = (gvr.raiMediaFilteredReasons || []).join(' | ')
      throw new Error(`Veo bloqueou o video pelo filtro de seguranca (RAI). Motivo: ${reasons || 'nao detalhado'}`)
    }
    throw new Error('Veo resposta sem uri: ' + JSON.stringify(op).slice(0, 500))
  }

  // O file URI tipicamente requer x-goog-api-key também
  const dl = await fetch(fileUri, { headers: { 'x-goog-api-key': KEY } })
  if (!dl.ok) throw new Error(`Download HTTP ${dl.status}: ${await dl.text()}`)
  const buf = Buffer.from(await dl.arrayBuffer())

  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, buf)
  return { path: outPath, bytes: buf.length, mime: 'video/mp4', operation: opName }
}

// Helper de prompt — roteiro curto a partir do texto do agente
export function reelPromptFromScript({ title, script, brand = 'Live Equipamentos' }) {
  return [
    `Vídeo vertical (9:16) de 8 segundos para Instagram Reel da marca "${brand}" (equipamentos de Pilates premium no Brasil).`,
    `Tema: ${title}.`,
    script ? `Direção visual: ${script.slice(0, 400)}` : '',
    `Estética: cinematográfica, iluminação natural suave, tons levemente dessaturados, movimento de câmera sutil, alta qualidade editorial.`,
    `Sem texto na tela. Sem logos.`,
    `IMPORTANTE: gere video totalmente silencioso, sem audio, sem narracao, sem trilha sonora, sem dialogo. Apenas imagem.`,
  ].filter(Boolean).join('\n')
}
