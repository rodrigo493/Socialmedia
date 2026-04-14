// ElevenLabs TTS — gera MP3 a partir de texto + voice_id

import fs from 'node:fs/promises'
import path from 'node:path'

const KEY = process.env.ELEVENLABS_API_KEY
const DEFAULT_VOICE = process.env.ELEVENLABS_VOICE_ID
const FEMALE = process.env.ELEVENLABS_VOICE_ID_FEMALE
const MALE = process.env.ELEVENLABS_VOICE_ID_MALE

export function voiceIdFor(gender) {
  if (gender === 'male') return MALE || DEFAULT_VOICE
  if (gender === 'female') return FEMALE || DEFAULT_VOICE
  return DEFAULT_VOICE
}

export async function tts({ text, outPath, voiceId, modelId = 'eleven_multilingual_v2' }) {
  if (!KEY) throw new Error('ELEVENLABS_API_KEY faltando')
  const voice = voiceId || DEFAULT_VOICE
  if (!voice) throw new Error('voiceId não definido (nem default)')

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: 'POST',
    headers: {
      'xi-api-key': KEY,
      'content-type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
    }),
  })
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, buf)
  return { path: outPath, bytes: buf.length, voiceId: voice }
}
