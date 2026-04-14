import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const OUTPUT = path.join(ROOT, 'squads', 'live-social-media', 'output')
const ANALYTICS_DIR = path.join(OUTPUT, 'analytics')
const CRIADOS = path.join(OUTPUT, 'criados')

async function readAllSnapshots() {
  try {
    const files = await fs.readdir(ANALYTICS_DIR)
    const all = []
    for (const f of files) {
      if (!f.endsWith('.jsonl')) continue
      const itemId = f.replace(/\.jsonl$/, '')
      const raw = await fs.readFile(path.join(ANALYTICS_DIR, f), 'utf8')
      const lines = raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
      if (!lines.length) continue
      // pega último snapshot de cada itemId
      const last = lines[lines.length - 1]
      all.push({ itemId, ...last })
    }
    return all
  } catch { return [] }
}

async function readItem(itemId) {
  try {
    return JSON.parse(await fs.readFile(path.join(CRIADOS, `${itemId}.item.json`), 'utf8'))
  } catch { return null }
}

export default async function dashboardRoutes(app) {
  // Agregado geral — total do mês corrente
  app.get('/api/v1/analytics/dashboard', async () => {
    const snaps = await readAllSnapshots()
    const items = await Promise.all(snaps.map(s => readItem(s.itemId)))

    const now = new Date()
    const thisMonth = now.toISOString().slice(0, 7)

    // Totais do mês
    const monthSnaps = snaps.filter((s, i) => {
      const publishedAt = items[i]?.postedAt || s.publishedAt
      return publishedAt && publishedAt.slice(0, 7) === thisMonth
    })
    const totals = { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, posts: monthSnaps.length }
    for (const s of monthSnaps) {
      totals.views += s.metrics?.views || 0
      totals.likes += s.metrics?.likes || 0
      totals.comments += s.metrics?.comments || 0
      totals.shares += s.metrics?.shares || 0
      totals.saves += s.metrics?.saves || 0
    }
    const engagement = totals.likes + totals.comments + totals.shares + totals.saves
    totals.engagement = engagement
    totals.engagementRate = totals.views ? +(engagement / totals.views * 100).toFixed(2) : null

    // Top posts por engagement
    const scored = snaps.map((s, i) => ({
      snap: s, item: items[i],
      score: (s.metrics?.likes || 0) + 2 * (s.metrics?.comments || 0) + 3 * (s.metrics?.shares || 0) + 3 * (s.metrics?.saves || 0),
    })).filter(x => x.item)
    scored.sort((a, b) => b.score - a.score)
    const topPosts = scored.slice(0, 8).map(x => ({
      itemId: x.item.id,
      title: x.item.title,
      agent: x.item.agent,
      type: x.item.type,
      platform: x.snap.platform,
      url: x.snap.url,
      metrics: x.snap.metrics,
      score: x.score,
      postedAt: x.item.postedAt || x.snap.publishedAt,
    }))

    // Tendência por agente
    const byAgent = {}
    for (let i = 0; i < snaps.length; i++) {
      const it = items[i]
      if (!it) continue
      const agent = it.agent || 'unknown'
      byAgent[agent] = byAgent[agent] || { agent, posts: 0, views: 0, engagement: 0 }
      byAgent[agent].posts++
      byAgent[agent].views += snaps[i].metrics?.views || 0
      byAgent[agent].engagement += (snaps[i].metrics?.likes || 0) + (snaps[i].metrics?.comments || 0) + (snaps[i].metrics?.shares || 0) + (snaps[i].metrics?.saves || 0)
    }
    const agents = Object.values(byAgent).sort((a, b) => b.engagement - a.engagement)

    // Por plataforma
    const byPlatform = {}
    for (const s of snaps) {
      const p = s.platform || 'unknown'
      byPlatform[p] = byPlatform[p] || { platform: p, posts: 0, views: 0, engagement: 0 }
      byPlatform[p].posts++
      byPlatform[p].views += s.metrics?.views || 0
      byPlatform[p].engagement += (s.metrics?.likes || 0) + (s.metrics?.comments || 0) + (s.metrics?.shares || 0) + (s.metrics?.saves || 0)
    }
    const platforms = Object.values(byPlatform).sort((a, b) => b.views - a.views)

    return {
      month: thisMonth,
      totals,
      topPosts,
      agents,
      platforms,
      allTimePosts: snaps.length,
    }
  })
}
