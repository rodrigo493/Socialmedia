// HeyGen — talking head avatars.
// Docs: https://docs.heygen.com/reference

import fs from 'node:fs/promises'
import path from 'node:path'

const KEY = process.env.HEYGEN_API_KEY
const BASE = 'https://api.heygen.com'

function headers() {
  if (!KEY) throw new Error('HEYGEN_API_KEY faltando no .env')
  return { 'X-Api-Key': KEY, 'content-type': 'application/json' }
}

export async function listAvatars() {
  const res = await fetch(`${BASE}/v2/avatars`, { headers: headers() })
  if (!res.ok) throw new Error(`HeyGen avatars ${res.status}: ${await res.text()}`)
  const data = await res.json()
  // data.data.avatars[] — normaliza
  return (data.data?.avatars || []).map(a => ({
    id: a.avatar_id,
    name: a.avatar_name,
    gender: a.gender,
    preview_image: a.preview_image_url,
    preview_video: a.preview_video_url,
    premium: a.premium,
  }))
}

export async function listVoices() {
  const res = await fetch(`${BASE}/v2/voices`, { headers: headers() })
  if (!res.ok) throw new Error(`HeyGen voices ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return (data.data?.voices || []).map(v => ({
    id: v.voice_id,
    name: v.name,
    language: v.language,
    gender: v.gender,
    preview: v.preview_audio,
  }))
}

// Gera vídeo talking head. Polling até ficar pronto (demora 1-3 min).
export async function generateVideo({ avatarId, voiceId, text, outPath, background = '#0B0B0C', timeoutMs = 10 * 60 * 1000, pollMs = 10_000 }) {
  // 1) submit
  const body = {
    video_inputs: [{
      character: { type: 'avatar', avatar_id: avatarId, avatar_style: 'normal' },
      voice: voiceId
        ? { type: 'text', input_text: text, voice_id: voiceId }
        : { type: 'text', input_text: text, voice_id: 'f9c4e8a5ab7a45e8a9f3ab58abb4b4ef' /* fallback pt-BR female */ },
      background: { type: 'color', value: background },
    }],
    dimension: { width: 720, height: 1280 }, // 9:16 pra reels
    aspect_ratio: '9:16',
  }

  const submit = await fetch(`${BASE}/v2/video/generate`, {
    method: 'POST', headers: headers(), body: JSON.stringify(body),
  })
  if (!submit.ok) throw new Error(`HeyGen generate ${submit.status}: ${await submit.text()}`)
  const { data } = await submit.json()
  const videoId = data?.video_id
  if (!videoId) throw new Error('HeyGen sem video_id')

  // 2) polling
  const start = Date.now()
  let videoUrl = null
  while (true) {
    if (Date.now() - start > timeoutMs) throw new Error('HeyGen timeout')
    await new Promise(r => setTimeout(r, pollMs))
    const s = await fetch(`${BASE}/v1/video_status.get?video_id=${videoId}`, { headers: headers() })
    if (!s.ok) throw new Error(`HeyGen status ${s.status}`)
    const st = await s.json()
    const status = st.data?.status
    if (status === 'completed') { videoUrl = st.data.video_url; break }
    if (status === 'failed') throw new Error('HeyGen falhou: ' + JSON.stringify(st.data?.error))
  }

  // 3) download
  const dl = await fetch(videoUrl)
  if (!dl.ok) throw new Error(`HeyGen download ${dl.status}`)
  const buf = Buffer.from(await dl.arrayBuffer())
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, buf)
  return { path: outPath, bytes: buf.length, videoId, sourceUrl: videoUrl }
}

export async function quota() {
  const res = await fetch(`${BASE}/v2/user/remaining_quota`, { headers: headers() })
  if (!res.ok) return null
  const d = await res.json()
  return d.data?.remaining_quota
}
