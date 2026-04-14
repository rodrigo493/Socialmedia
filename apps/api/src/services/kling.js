// Kling 2.5 image-to-video via Fal.ai
// Model: fal-ai/kling-video/v2.5-turbo/pro/image-to-video

import path from 'node:path'
import * as fal from './fal.js'

const MODEL = 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video'

export async function imageToVideo({ imagePath, prompt, outPath, duration = 5, aspectRatio = '9:16' }) {
  const imageUrl = await fal.uploadFile(imagePath)

  const result = await fal.run(MODEL, {
    prompt,
    image_url: imageUrl,
    duration: String(duration), // Kling aceita "5" ou "10"
    aspect_ratio: aspectRatio,
    negative_prompt: 'blur, distort, low quality, static, cartoon, watermark, text overlay',
  }, { timeoutMs: 10 * 60 * 1000 })

  const videoUrl = result?.data?.video?.url || result?.video?.url
  if (!videoUrl) throw new Error('Kling sem video.url: ' + JSON.stringify(result).slice(0, 500))

  await fal.downloadTo(videoUrl, outPath)
  return { path: outPath, sourceUrl: videoUrl }
}
