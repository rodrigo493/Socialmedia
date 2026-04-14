// Publisher TikTok via Playwright (perfil @liveuniequipamentos).
// Mesmo padrão do Instagram: perfil persistente, 1o login headed, posts subsequentes.

import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const PROFILE_DIR = path.join(ROOT, '_opensquad', '_browser_profile', 'tiktok')
const SCREENSHOT_DIR = path.join(ROOT, 'apps', 'api', 'data', 'screenshots')

async function ensureDirs() {
  await fs.mkdir(PROFILE_DIR, { recursive: true })
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true })
}

async function openContext({ headless = false } = {}) {
  await ensureDirs()
  return chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    viewport: { width: 1440, height: 900 },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    args: ['--disable-blink-features=AutomationControlled'],
  })
}

async function isLoggedIn(page) {
  await page.goto('https://www.tiktok.com/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  const loginBtn = await page.$('button:has-text("Entrar"), a[href*="/login"]')
  return !loginBtn
}

export async function login() {
  const ctx = await openContext({ headless: false })
  const page = await ctx.newPage()
  await page.goto('https://www.tiktok.com/login')
  console.log('[tiktok] Login manual. Feche a janela quando terminar.')
  await page.waitForEvent('close', { timeout: 0 }).catch(() => {})
  await ctx.close()
}

// Publica vídeo no feed (reel TikTok). videoPath absoluto.
export async function publishVideo({ videoPath, caption }) {
  if (!videoPath) throw new Error('videoPath obrigatório')
  const ctx = await openContext({ headless: false })
  const page = await ctx.newPage()
  const timestamp = Date.now()

  try {
    if (!(await isLoggedIn(page))) {
      await ctx.close()
      throw new Error('Sessão TikTok não logada. Rode POST /api/v1/publishers/tiktok/login antes.')
    }

    await page.goto('https://www.tiktok.com/tiktokstudio/upload', { waitUntil: 'domcontentloaded' })

    // Upload
    const fileInput = await page.waitForSelector('input[type="file"]', { state: 'attached', timeout: 15000 })
    await fileInput.setInputFiles(videoPath)

    // Aguarda processar
    await page.waitForTimeout(4000)

    // Preenche caption
    if (caption) {
      const editor = await page.waitForSelector('div[contenteditable="true"]', { timeout: 15000 })
      await editor.click()
      await page.keyboard.type(caption, { delay: 8 })
    }

    // Aguarda upload finalizar
    await page.waitForSelector('text=/enviado|uploaded/i', { timeout: 180000 }).catch(() => {})

    // Publicar
    await page.getByRole('button', { name: /publicar|post/i }).click()
    await page.waitForTimeout(5000)

    const shotPath = path.join(SCREENSHOT_DIR, `tt-${timestamp}.png`)
    await page.screenshot({ path: shotPath, fullPage: false })

    return {
      platform: 'tiktok',
      publishedAt: new Date().toISOString(),
      screenshot: path.relative(ROOT, shotPath).replace(/\\/g, '/'),
      url: null,
    }
  } finally {
    await ctx.close()
  }
}
