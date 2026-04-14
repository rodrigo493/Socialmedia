// Publisher Instagram via Playwright.
// - Reusa o perfil persistente em _opensquad/_browser_profile/instagram/
// - No 1o uso abre headed para login manual; subsequentes rodam headless
// - Suporta feed post (imagem única ou carrossel). Reel/Story ainda stub.

import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const PROFILE_DIR = path.join(ROOT, '_opensquad', '_browser_profile', 'instagram')
const SCREENSHOT_DIR = path.join(ROOT, 'apps', 'api', 'data', 'screenshots')

async function ensureDirs() {
  await fs.mkdir(PROFILE_DIR, { recursive: true })
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true })
}

async function openContext({ headless = true } = {}) {
  await ensureDirs()
  return chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    viewport: { width: 1280, height: 900 },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    args: ['--disable-blink-features=AutomationControlled'],
  })
}

async function isLoggedIn(page) {
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' })
  // Se aparece botão "Entrar" ou campo de login => deslogado
  const loginField = await page.$('input[name="username"]')
  return !loginField
}

// Chama primeiro login manual em modo headed
export async function login() {
  const ctx = await openContext({ headless: false })
  const page = await ctx.newPage()
  await page.goto('https://www.instagram.com/accounts/login/')
  console.log('[instagram] Faça login manualmente na janela que abriu. Feche o Chromium quando terminar.')
  // espera até fechar
  await page.waitForEvent('close', { timeout: 0 }).catch(() => {})
  await ctx.close()
}

export async function publishFeed({ images, caption }) {
  if (!images || images.length === 0) throw new Error('images[] vazio')
  const ctx = await openContext({ headless: false }) // headed por segurança até validar
  const page = await ctx.newPage()
  const timestamp = Date.now()

  try {
    if (!(await isLoggedIn(page))) {
      await ctx.close()
      throw new Error('Sessão Instagram não logada. Rode POST /api/v1/publishers/instagram/login antes.')
    }

    // Botão "Nova publicação" (ícone +)
    await page.getByRole('link', { name: /criar/i }).first().click().catch(async () => {
      await page.getByRole('button', { name: /criar/i }).first().click()
    })

    // Upload do(s) arquivo(s)
    const fileInput = await page.waitForSelector('input[type="file"]', { state: 'attached', timeout: 15000 })
    await fileInput.setInputFiles(images)

    // Avança: Selecionar -> Avançar (editor) -> Avançar (filtros)
    for (let i = 0; i < 2; i++) {
      await page.getByRole('button', { name: /avançar/i }).click()
      await page.waitForTimeout(1200)
    }

    // Caption
    if (caption) {
      const textarea = await page.waitForSelector('textarea[aria-label*="legenda" i], textarea', { timeout: 10000 })
      await textarea.fill(caption)
    }

    // Compartilhar
    await page.getByRole('button', { name: /compartilhar|publicar/i }).click()
    await page.waitForSelector('text=/publicação.*compartilhada|post.*shared/i', { timeout: 60000 })

    const shotPath = path.join(SCREENSHOT_DIR, `ig-${timestamp}.png`)
    await page.screenshot({ path: shotPath, fullPage: false })

    return {
      platform: 'instagram_feed',
      publishedAt: new Date().toISOString(),
      screenshot: path.relative(ROOT, shotPath).replace(/\\/g, '/'),
      url: null, // IG não expõe a URL logo após o post; seria preciso navegar no perfil
    }
  } finally {
    await ctx.close()
  }
}

export async function publishReel() {
  throw new Error('publishReel ainda não implementado — próxima sprint')
}

export async function publishStory() {
  throw new Error('publishStory ainda não implementado — próxima sprint')
}
