// "Studio" — orquestrador que combina persona + produto + voz → vídeo completo

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as kling from '../services/kling.js'
import * as eleven from '../services/elevenlabs.js'
import * as ffmpeg from '../services/ffmpeg.js'
import * as heygen from '../services/heygen.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const PRODUCTS = path.join(ROOT, 'squads', 'live-social-media', '_products')
const CRIADOS = path.join(ROOT, 'squads', 'live-social-media', 'output', 'criados')

async function loadProduct(slug) {
  const dir = path.join(PRODUCTS, slug)
  const raw = await fs.readFile(path.join(dir, 'catalog.json'), 'utf8')
  const catalog = JSON.parse(raw)
  return { dir, catalog }
}

export default async function studioRoutes(app) {
  // Vídeo da persona usando o produto
  // mode: 'scene' (Kling cinematográfico, default) | 'talking-head' (HeyGen lip-sync)
  app.post('/api/v1/studio/persona-usa-produto', async (req, reply) => {
    const { personaImage, productSlug, sceneHint, voiceText, gender = 'female', duration = 5, mode = 'scene', avatarId } = req.body || {}
    if (!productSlug) { reply.code(400); return { error: 'productSlug obrigatório' } }
    if (mode === 'scene' && !personaImage) { reply.code(400); return { error: 'personaImage obrigatório em mode=scene' } }
    if (mode === 'talking-head' && !voiceText) { reply.code(400); return { error: 'voiceText obrigatório em mode=talking-head' } }

    const id = `persona-${productSlug}-${Date.now()}`
    const itemDir = path.join(CRIADOS, id)
    await fs.mkdir(itemDir, { recursive: true })

    try {
      // Carrega produto
      const { catalog } = await loadProduct(productSlug)

      // --- MODO TALKING-HEAD (HeyGen) -------------------------------------
      if (mode === 'talking-head') {
        const videoPath = path.join(itemDir, 'video-final.mp4')
        const scriptText = [
          voiceText,
          `\n\n[Cena: ${catalog.name} · ${catalog.category}]`,
        ].join('')

        await heygen.generateVideo({
          avatarId: avatarId || process.env.HEYGEN_AVATAR_ID,
          text: voiceText,
          outPath: videoPath,
        })

        const finalRel = path.relative(CRIADOS, videoPath).replace(/\\/g, '/')
        const item = {
          id, type: 'reel', agent: 'studio',
          squad: 'live-social-media',
          createdAt: new Date().toISOString(),
          status: 'pending_approval',
          title: `${catalog.name} · talking head`,
          caption: voiceText,
          media: [{ role: 'video', path: finalRel, mime: 'video/mp4' }],
          targets: ['instagram_reel', 'tiktok'],
          productSlug,
          mode: 'talking-head',
          avatarId: avatarId || process.env.HEYGEN_AVATAR_ID,
          source: { origin: 'studio/persona-usa-produto/talking-head' },
        }
        await fs.writeFile(path.join(CRIADOS, `${id}.item.json`), JSON.stringify(item, null, 2))
        return { ok: true, item }
      }

      // --- MODO SCENE (Kling + ElevenLabs) ---------------------------------
      const personaPath = path.isAbsolute(personaImage)
        ? personaImage
        : path.join(CRIADOS, personaImage)

      const prompt = [
        `Pessoa (imagem de referência) usando o equipamento "${catalog.name}" (${catalog.category}).`,
        catalog.differential ? `Diferencial do equipamento: ${catalog.differential}.` : '',
        catalog.description ? `Contexto: ${catalog.description}.` : '',
        sceneHint ? `Cena: ${sceneHint}.` : `Cena: studio premium, iluminação natural suave, movimento controlado.`,
        `Estética: cinematográfica, plano médio, alta fidelidade, realismo fotográfico.`,
      ].filter(Boolean).join(' ')

      const videoPath = path.join(itemDir, 'video.mp4')
      await kling.imageToVideo({ imagePath: personaPath, prompt, outPath: videoPath, duration, aspectRatio: '9:16' })

      // 5) voz (opcional)
      let voicePath = null
      let finalPath = videoPath
      if (voiceText) {
        voicePath = path.join(itemDir, 'voice.mp3')
        await eleven.tts({ text: voiceText, outPath: voicePath, voiceId: eleven.voiceIdFor(gender) })

        // 5b) mux vídeo + voz → video-final.mp4
        try {
          finalPath = path.join(itemDir, 'video-final.mp4')
          await ffmpeg.muxVideoAudio({ videoPath, audioPath: voicePath, outPath: finalPath })
        } catch (err) {
          app.log.warn({ err: err.message }, 'mux falhou, mantendo video.mp4 mudo')
          finalPath = videoPath
        }
      }

      // 6) escreve .item.json do item criado
      const finalRel = path.relative(CRIADOS, finalPath).replace(/\\/g, '/')
      const item = {
        id, type: 'reel', agent: 'studio',
        squad: 'live-social-media',
        createdAt: new Date().toISOString(),
        status: 'pending_approval',
        title: `${catalog.name} · persona IA`,
        caption: voiceText || `Nova cena com ${catalog.name}.`,
        media: [
          { role: 'video', path: finalRel, mime: 'video/mp4' },
          ...(voicePath ? [{ role: 'voice', path: `${id}/voice.mp3`, mime: 'audio/mpeg' }] : []),
          ...(finalPath !== videoPath ? [{ role: 'video_raw', path: `${id}/video.mp4`, mime: 'video/mp4' }] : []),
        ],
        targets: ['instagram_reel', 'tiktok'],
        productSlug,
        prompt,
        source: { origin: 'studio/persona-usa-produto' },
      }
      await fs.writeFile(path.join(CRIADOS, `${id}.item.json`), JSON.stringify(item, null, 2))
      return { ok: true, item }
    } catch (err) {
      app.log.error(err)
      reply.code(500); return { error: String(err.message || err) }
    }
  })

  // TTS manual (útil pra testar voz)
  app.post('/api/v1/media/voice', async (req, reply) => {
    const { text, name = `voice-${Date.now()}.mp3`, gender = 'female', voiceId } = req.body || {}
    if (!text) { reply.code(400); return { error: 'text obrigatório' } }
    const outPath = path.join(CRIADOS, '_tests', name)
    try {
      const r = await eleven.tts({ text, outPath, voiceId: voiceId || eleven.voiceIdFor(gender) })
      return { ok: true, ...r, relPath: path.relative(CRIADOS, outPath).replace(/\\/g, '/') }
    } catch (err) {
      reply.code(500); return { error: String(err.message || err) }
    }
  })

  // Kling i2v manual — qualquer imagem + prompt vira vídeo
  app.post('/api/v1/media/video-from-image', async (req, reply) => {
    const { imagePath, prompt, name = `i2v-${Date.now()}.mp4`, duration = 5, aspectRatio = '9:16' } = req.body || {}
    if (!imagePath || !prompt) { reply.code(400); return { error: 'imagePath e prompt obrigatórios' } }
    const outPath = path.join(CRIADOS, '_tests', name)
    const absImg = path.isAbsolute(imagePath) ? imagePath : path.join(ROOT, imagePath)
    try {
      const r = await kling.imageToVideo({ imagePath: absImg, prompt, outPath, duration, aspectRatio })
      return { ok: true, ...r, relPath: path.relative(CRIADOS, outPath).replace(/\\/g, '/') }
    } catch (err) {
      reply.code(500); return { error: String(err.message || err) }
    }
  })
}
