// Analytics pós-post via Apify.
// - Instagram: actor `apify/instagram-post-scraper`
// - TikTok: actor `clockworks/tiktok-scraper`
// Snapshots persistidos como JSONL em output/analytics/<itemId>.jsonl
// Cada linha é { at, url, platform, metrics: {...} }

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const OUTPUT = path.join(ROOT, 'squads', 'live-social-media', 'output')
const ANALYTICS_DIR = path.join(OUTPUT, 'analytics')
const CRIADOS = path.join(OUTPUT, 'criados')

const TOKEN = process.env.APIFY_TOKEN

function detectPlatform(url) {
  if (!url) return null
  if (/instagram\.com/.test(url)) return 'instagram'
  if (/tiktok\.com/.test(url)) return 'tiktok'
  return null
}

async function runApifyActor(actorId, input, { timeoutMs = 5 * 60 * 1000, pollMs = 5000 } = {}) {
  if (!TOKEN) throw new Error('APIFY_TOKEN faltando')

  // 1) run actor sync (ou async + poll)
  const runRes = await fetch(`https://api.apify.com/v2/acts/${actorId.replace('/', '~')}/runs?token=${TOKEN}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!runRes.ok) throw new Error(`Apify run ${runRes.status}: ${await runRes.text()}`)
  const { data: run } = await runRes.json()
  const runId = run.id

  // 2) poll até SUCCEEDED
  const start = Date.now()
  while (true) {
    if (Date.now() - start > timeoutMs) throw new Error('Apify timeout')
    await new Promise(r => setTimeout(r, pollMs))
    const s = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${TOKEN}`)
    const sJ = await s.json()
    const status = sJ.data?.status
    if (status === 'SUCCEEDED') {
      const dsId = sJ.data.defaultDatasetId
      const items = await fetch(`https://api.apify.com/v2/datasets/${dsId}/items?token=${TOKEN}&clean=true`)
      return await items.json()
    }
    if (['FAILED', 'TIMED-OUT', 'ABORTED'].includes(status)) throw new Error('Apify status: ' + status)
  }
}

export async function fetchInstagramMetrics(url) {
  const items = await runApifyActor('apify/instagram-post-scraper', {
    directUrls: [url], resultsLimit: 1,
  })
  const p = items?.[0] || {}
  return {
    platform: 'instagram',
    url,
    metrics: {
      likes: p.likesCount ?? null,
      comments: p.commentsCount ?? null,
      views: p.videoViewCount ?? p.videoPlayCount ?? null,
      shares: null,
      saves: null,
    },
    caption: p.caption || null,
    publishedAt: p.timestamp || null,
    raw: null, // omit raw para poupar disco
  }
}

export async function fetchTikTokMetrics(url) {
  const items = await runApifyActor('clockworks/tiktok-scraper', {
    postURLs: [url], resultsPerPage: 1,
  })
  const p = items?.[0] || {}
  return {
    platform: 'tiktok',
    url,
    metrics: {
      likes: p.diggCount ?? null,
      comments: p.commentCount ?? null,
      views: p.playCount ?? null,
      shares: p.shareCount ?? null,
      saves: p.collectCount ?? null,
    },
    caption: p.text || null,
    publishedAt: p.createTime ? new Date(p.createTime * 1000).toISOString() : null,
  }
}

export async function fetchMetrics(url) {
  const platform = detectPlatform(url)
  if (platform === 'instagram') return fetchInstagramMetrics(url)
  if (platform === 'tiktok') return fetchTikTokMetrics(url)
  throw new Error('Plataforma não suportada: ' + url)
}

async function appendSnapshot(itemId, snapshot) {
  await fs.mkdir(ANALYTICS_DIR, { recursive: true })
  const file = path.join(ANALYTICS_DIR, `${itemId}.jsonl`)
  const line = JSON.stringify({ at: new Date().toISOString(), ...snapshot }) + '\n'
  await fs.appendFile(file, line)
}

export async function captureForItem(itemId) {
  const itemPath = path.join(CRIADOS, `${itemId}.item.json`)
  const raw = await fs.readFile(itemPath, 'utf8')
  const item = JSON.parse(raw)
  const urls = []
  if (item.publishResults) {
    for (const r of item.publishResults) if (r.url) urls.push(r.url)
  }
  if (item.publicUrls) {
    for (const u of item.publicUrls) urls.push(u)
  }
  if (urls.length === 0) return { itemId, error: 'item sem URL publicada' }

  const snapshots = []
  for (const url of urls) {
    try {
      const snap = await fetchMetrics(url)
      await appendSnapshot(itemId, snap)
      snapshots.push(snap)
    } catch (err) {
      snapshots.push({ url, error: String(err.message || err) })
    }
  }
  return { itemId, snapshots }
}

export async function getTimeline(itemId) {
  const file = path.join(ANALYTICS_DIR, `${itemId}.jsonl`)
  try {
    const raw = await fs.readFile(file, 'utf8')
    return raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
  } catch { return [] }
}

export async function listItemsWithMetrics() {
  try {
    const files = await fs.readdir(ANALYTICS_DIR)
    return files.filter(f => f.endsWith('.jsonl')).map(f => f.replace(/\.jsonl$/, ''))
  } catch { return [] }
}

// URL é opcional no item .item.json. Adiciona/atualiza manualmente.
export async function setItemUrl(itemId, { url, platform }) {
  const itemPath = path.join(CRIADOS, `${itemId}.item.json`)
  const raw = await fs.readFile(itemPath, 'utf8')
  const item = JSON.parse(raw)
  item.publicUrls = item.publicUrls || []
  item.publicUrls.push(url)
  item.publishResults = item.publishResults || []
  item.publishResults.push({ platform: platform || detectPlatform(url) || 'unknown', url, addedManually: true, at: new Date().toISOString() })
  await fs.writeFile(itemPath, JSON.stringify(item, null, 2))
  return item
}
