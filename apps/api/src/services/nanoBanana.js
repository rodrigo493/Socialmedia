// Nano Banana = Gemini 2.5 Flash Image Preview
// Gera PNG a partir de um prompt textual. Salva em disco e devolve metadata.

import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LIBRARY_PATH = path.resolve(__dirname, '..', '..', '..', '..', 'squads', 'live-social-media', 'pipeline', 'data', 'influencer-prompts-library.json')
let _library = null
export function library() {
  if (!_library) _library = JSON.parse(fsSync.readFileSync(LIBRARY_PATH, 'utf8'))
  return _library
}

const KEY = process.env.GOOGLE_AI_STUDIO_KEY
// Modelos de imagem disponíveis (Nov/2025): gemini-2.5-flash-image (GA) ·
// nano-banana-pro-preview · gemini-3.1-flash-image-preview · gemini-3-pro-image-preview ·
// imagen-4.0-generate-001 · imagen-4.0-fast-generate-001
const MODEL = process.env.NANO_BANANA_MODEL || 'gemini-2.5-flash-image'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

export async function generateImage({ prompt, outPath, aspectRatio, referenceImagePath }) {
  if (!KEY) throw new Error('GOOGLE_AI_STUDIO_KEY faltando no .env')

  const parts = [{ text: prompt }]
  if (referenceImagePath) {
    const buf = await fs.readFile(referenceImagePath)
    const ext = path.extname(referenceImagePath).toLowerCase()
    const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[ext] || 'image/png'
    parts.push({ inlineData: { mimeType: mime, data: buf.toString('base64') } })
  }

  const body = {
    contents: [{ parts }],
    generationConfig: aspectRatio ? { imageConfig: { aspectRatio } } : undefined,
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Nano Banana HTTP ${res.status}: ${await res.text()}`)
  }
  const data = await res.json()

  const responseParts = data.candidates?.[0]?.content?.parts || []
  const imgPart = responseParts.find(p => p.inlineData?.data)
  if (!imgPart) throw new Error('Resposta sem inlineData — payload: ' + JSON.stringify(data).slice(0, 500))

  const buf = Buffer.from(imgPart.inlineData.data, 'base64')
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, buf)
  return {
    path: outPath,
    bytes: buf.length,
    mime: imgPart.inlineData.mimeType || 'image/png',
  }
}

// Helpers de prompt para tipos específicos do squad -------------------------

export function carouselSlidePrompt({ brand = 'Live Equipamentos', slide, index, total, brandContext = '' }) {
  return [
    `Crie um slide editorial para Instagram (formato 4:5) de uma marca de equipamentos de Pilates premium chamada "${brand}".`,
    `É o slide ${index} de ${total} de um carrossel.`,
    `Headline principal do slide: "${slide.headline}".`,
    slide.sub ? `Subtexto: "${slide.sub}".` : '',
    `Estilo visual: tipografia moderna serif italic para headline, sans-serif para subtexto, fundo escuro sofisticado (tons grafite/carvão) com contraste mínimo dramático, leve grão fílmico, paleta vermelho queimado (#E5322B) como acento raro, muito espaço negativo.`,
    `Ratio: 4:5 (1080x1350). Sem marcas d'água, sem logos genéricos. Texto legível e centralizado na composição.`,
    brandContext ? `\n--- DIRETRIZES DA MARCA E REFERÊNCIAS DE CONCORRENTES ---\n${brandContext}` : '',
  ].filter(Boolean).join('\n')
}

// Prompt de rosto inicial — usa archetype da biblioteca Live ou custom
export function facePortraitPrompt({ archetype, custom, persona }) {
  const lib = library()
  if (archetype && lib.archetypes[archetype]) {
    return lib.archetypes[archetype].prompt
  }
  if (custom) return custom
  // fallback: monta a partir da persona da Iris
  return [
    `Um retrato natural em close-up de ${persona?.age || 34} anos, brasileira, ${persona?.ethnicity || 'latina'}, ${persona?.traços || 'cabelos castanhos médios'}, rosto simétrico, deslumbrante, sob luz suave.`,
    `Fotografia tirada com uma lente de 50mm, alta resolução e perfil de cor limpo. A câmera foca na área ao redor das bochechas e nariz, revelando poros sutis, textura natural da pele e micro pelos faciais.`,
  ].join(' ')
}

// Ângulos do character sheet — usa os prompts oficiais Live (Fundo Neutro)
// IMPORTANTE: esses prompts são usados em modo multimodal com a imagem
// face-base.png passada como referência. Reforçamos ao modelo que deve usar
// a PESSOA DA IMAGEM ANEXADA, não criar uma nova.
export function characterSheetPrompt({ angle }) {
  const lib = library()
  const base = lib.characterSheet[angle] || lib.characterSheet.front
  return [
    'USE A MESMA PESSOA EXATA DA IMAGEM DE REFERÊNCIA ANEXADA.',
    'Não crie uma pessoa nova. Não altere idade, etnia, cor de cabelo, cor de olhos, formato do rosto, traços, maquiagem ou biotipo corporal.',
    'Mantenha 100% a identidade visual da pessoa da imagem anexada.',
    '',
    base,
  ].join('\n')
}

export function listArchetypes() {
  return Object.entries(library().archetypes).map(([id, a]) => ({ id, label: a.label }))
}
