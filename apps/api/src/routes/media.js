import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import * as nano from '../services/nanoBanana.js'
import * as veo from '../services/veo.js'
import * as eleven from '../services/elevenlabs.js'
import * as ffmpeg from '../services/ffmpeg.js'
import * as heygen from '../services/heygen.js'
import { visualBriefBlock } from '../services/context.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const CRIADOS = path.join(ROOT, 'squads', 'live-social-media', 'output', 'criados')

async function loadItem(id) {
  const file = path.join(CRIADOS, `${id}.item.json`)
  const raw = await fs.readFile(file, 'utf8')
  return { item: JSON.parse(raw), file }
}
async function saveItem(file, item) {
  await fs.writeFile(file, JSON.stringify(item, null, 2))
}

export default async function mediaRoutes(app) {
  // Lista de arquétipos disponíveis (para UI oferecer opções)
  app.get('/api/v1/influencer/archetypes', async () => nano.listArchetypes())

  // Geração manual de vídeo (Veo 3)
  app.post('/api/v1/media/video', async (req, reply) => {
    const { prompt, name = `video-${Date.now()}.mp4`, aspectRatio = '9:16' } = req.body || {}
    if (!prompt) { reply.code(400); return { error: 'prompt obrigatório' } }
    const outPath = path.join(CRIADOS, '_tests', name)
    try {
      const r = await veo.generateVideo({ prompt, outPath, aspectRatio })
      return { ok: true, ...r, relPath: path.relative(CRIADOS, outPath).replace(/\\/g, '/') }
    } catch (err) {
      reply.code(500); return { error: String(err.message || err) }
    }
  })

  // Geração manual — útil para testes
  app.post('/api/v1/media/image', async (req, reply) => {
    const { prompt, name = `test-${Date.now()}.png`, aspectRatio = '4:5' } = req.body || {}
    if (!prompt) { reply.code(400); return { error: 'prompt obrigatório' } }
    const outPath = path.join(CRIADOS, '_tests', name)
    try {
      const r = await nano.generateImage({ prompt, outPath, aspectRatio })
      return { ok: true, ...r, relPath: path.relative(CRIADOS, outPath).replace(/\\/g, '/') }
    } catch (err) {
      reply.code(500); return { error: String(err.message || err) }
    }
  })

  // Orquestrador: gera toda a mídia de um item (slides do carrossel ou 4 ângulos
  // do character sheet). Atualiza item.media[] e salva em disco.
  app.post('/api/v1/items/:id/generate-media', async (req, reply) => {
    let data
    try { data = await loadItem(req.params.id) }
    catch { reply.code(404); return { error: 'item não encontrado' } }
    const { item, file } = data

    item.status = 'generating'
    await saveItem(file, item)

    try {
      const media = []
      const itemDir = path.join(CRIADOS, item.id)
      const brandContext = await visualBriefBlock()

      if (item.type === 'carousel' && Array.isArray(item.slides)) {
        const total = item.slides.length
        for (const slide of item.slides) {
          const prompt = nano.carouselSlidePrompt({ slide, index: slide.idx, total, brandContext })
          const file = `slide-${String(slide.idx).padStart(2, '0')}.png`
          const outPath = path.join(itemDir, file)
          await nano.generateImage({ prompt, outPath, aspectRatio: '4:5' })
          media.push({ role: 'slide', index: slide.idx, path: `${item.id}/${file}`, mime: 'image/png' })
        }
      } else if (item.type === 'reel' || item.type === 'tiktok') {
        // Se item pediu talking-head via HeyGen
        if (item.mode === 'talking-head' && (item.voiceText || item.script)) {
          const videoPath = path.join(itemDir, 'video-final.mp4')
          await heygen.generateVideo({
            avatarId: item.avatarId || process.env.HEYGEN_AVATAR_ID,
            text: item.voiceText || item.script,
            outPath: videoPath,
          })
          media.push({ role: 'video', path: `${item.id}/video-final.mp4`, mime: 'video/mp4' })
        } else {
          // Vídeo cinematográfico Veo 3
          const prompt = veo.reelPromptFromScript({ title: item.title, script: item.script || item.caption, brandContext })
          const videoPath = path.join(itemDir, 'video.mp4')
          await veo.generateVideo({ prompt, outPath: videoPath, aspectRatio: '9:16' })

          // Se tiver voiceText, gera voz ElevenLabs e mux
          if (item.voiceText) {
            const voicePath = path.join(itemDir, 'voice.mp3')
            await eleven.tts({ text: item.voiceText, outPath: voicePath, voiceId: eleven.voiceIdFor('female') })
            const finalPath = path.join(itemDir, 'video-final.mp4')
            try {
              await ffmpeg.muxVideoAudio({ videoPath, audioPath: voicePath, outPath: finalPath })
              media.push({ role: 'video', path: `${item.id}/video-final.mp4`, mime: 'video/mp4' })
              media.push({ role: 'voice', path: `${item.id}/voice.mp3`, mime: 'audio/mpeg' })
              media.push({ role: 'video_raw', path: `${item.id}/video.mp4`, mime: 'video/mp4' })
            } catch {
              media.push({ role: 'video', path: `${item.id}/video.mp4`, mime: 'video/mp4' })
              media.push({ role: 'voice', path: `${item.id}/voice.mp3`, mime: 'audio/mpeg' })
            }
          } else {
            media.push({ role: 'video', path: `${item.id}/video.mp4`, mime: 'video/mp4' })
          }
        }
      } else if (item.type === 'story') {
        // Story = N frames de imagem (9:16) gerados com o mesmo tema
        const total = item.frames || 4
        const base = item.title || 'story'
        for (let i = 1; i <= total; i++) {
          const prompt = [
            `Frame ${i} de ${total} de story de Instagram (9:16) da marca Live Equipamentos (fabricante brasileira de equipamentos de Pilates premium).`,
            `Tema: ${base}.`,
            `${item.caption || ''}`,
            `Estética: fotografia editorial, tom de bastidor/backstage, iluminação cinematográfica suave, tons grafite/carvão com acento vermelho queimado, leve grão fílmico.`,
            `Sem texto na imagem, sem logos sobrepostos. Imagem pronta para receber overlay de texto.`,
            brandContext ? `\n--- DIRETRIZES DA MARCA E REFERÊNCIAS DE CONCORRENTES ---\n${brandContext}` : '',
          ].filter(Boolean).join(' ')
          const f = `frame-${String(i).padStart(2,'0')}.png`
          const outPath = path.join(itemDir, f)
          await nano.generateImage({ prompt, outPath, aspectRatio: '9:16' })
          media.push({ role: 'story_frame', index: i, path: `${item.id}/${f}`, mime: 'image/png' })
        }
      } else if (item.type === 'influencer_brief') {
        // 1) Rosto-base a partir do archetype escolhido
        const facePrompt = nano.facePortraitPrompt({
          archetype: item.archetype,
          custom: item.faceCustomPrompt,
          persona: item.persona,
        })
        const faceFile = 'face-base.png'
        const faceOut = path.join(itemDir, faceFile)
        await nano.generateImage({ prompt: facePrompt, outPath: faceOut, aspectRatio: '3:4' })
        media.push({ role: 'face_base', path: `${item.id}/${faceFile}`, mime: 'image/png' })

        // 2) Character sheet (4 ângulos) — usa face-base.png como referência multimodal
        // garantindo que é a MESMA pessoa em todos os ângulos
        for (const angle of ['front', 'right', 'left', 'back']) {
          const prompt = nano.characterSheetPrompt({ angle })
          const f = `character-${angle}.png`
          const outPath = path.join(itemDir, f)
          await nano.generateImage({
            prompt,
            outPath,
            aspectRatio: '3:4',
            referenceImagePath: faceOut,
          })
          media.push({ role: 'character_sheet', angle, path: `${item.id}/${f}`, mime: 'image/png' })
        }
      } else {
        reply.code(400)
        item.status = 'pending_approval'
        await saveItem(file, item)
        return { error: `Geração não implementada para type=${item.type}. Por ora: carousel, reel, tiktok, influencer_brief.` }
      }

      item.media = media
      item.status = 'pending_approval'
      await saveItem(file, item)
      return { ok: true, item }
    } catch (err) {
      app.log.error(err)
      item.status = 'error'
      item.lastError = String(err.message || err)
      await saveItem(file, item)
      reply.code(500); return { error: item.lastError }
    }
  })
}
