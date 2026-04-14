// Monitor de créditos — consulta saldo dos serviços que expõem via API.
// Cacheia resultado por 5 minutos para não bater toda request.

const TTL = 5 * 60 * 1000
const cache = { at: 0, data: null }

async function fetchElevenLabs() {
  const KEY = process.env.ELEVENLABS_API_KEY
  if (!KEY) return { service: 'elevenlabs', status: 'no_key' }
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': KEY } })
    if (!res.ok) return { service: 'elevenlabs', status: 'error', code: res.status }
    const d = await res.json()
    const used = d.character_count ?? 0
    const limit = d.character_limit ?? 0
    const remaining = limit - used
    const pct = limit ? Math.round((used / limit) * 100) : 0
    return {
      service: 'elevenlabs', status: 'ok',
      unit: 'chars', used, limit, remaining, pct,
      tier: d.tier || 'free',
      resetAt: d.next_character_count_reset_unix ? new Date(d.next_character_count_reset_unix * 1000).toISOString() : null,
      low: remaining < 10000,
    }
  } catch (err) {
    return { service: 'elevenlabs', status: 'error', error: String(err.message || err) }
  }
}

async function fetchApify() {
  const KEY = process.env.APIFY_TOKEN
  if (!KEY) return { service: 'apify', status: 'no_key' }
  try {
    const res = await fetch('https://api.apify.com/v2/users/me/limits', { headers: { Authorization: 'Bearer ' + KEY } })
    if (!res.ok) return { service: 'apify', status: 'error', code: res.status }
    const d = await res.json()
    const info = d.data || {}
    const used = info.current?.monthlyUsageUsd ?? 0
    const limit = info.limits?.maxMonthlyUsageUsd ?? 0
    const remaining = Math.max(0, limit - used)
    const pct = limit ? Math.round((used / limit) * 100) : 0
    return {
      service: 'apify', status: 'ok',
      unit: 'usd', used: Number(used.toFixed(2)), limit: Number(limit.toFixed(2)), remaining: Number(remaining.toFixed(2)), pct,
      low: limit > 0 && remaining < limit * 0.1,
    }
  } catch (err) {
    return { service: 'apify', status: 'error', error: String(err.message || err) }
  }
}

async function fetchHeyGen() {
  const KEY = process.env.HEYGEN_API_KEY
  if (!KEY) return { service: 'heygen', status: 'no_key' }
  try {
    const res = await fetch('https://api.heygen.com/v2/user/remaining_quota', { headers: { 'X-Api-Key': KEY } })
    if (!res.ok) return { service: 'heygen', status: 'error', code: res.status }
    const d = await res.json()
    const remaining = d.data?.remaining_quota ?? 0 // segundos
    return {
      service: 'heygen', status: 'ok',
      unit: 'seconds', used: null, limit: null, remaining, pct: null,
      low: remaining < 60,
    }
  } catch (err) {
    return { service: 'heygen', status: 'error', error: String(err.message || err) }
  }
}

// Os abaixo não expõem saldo via API — fica listado como "unavailable" com link
function unavailable(service, dashboard) {
  return { service, status: 'unavailable', note: 'A API não expõe saldo. Consulte o dashboard.', dashboard }
}

export async function getAllCredits({ force = false } = {}) {
  if (!force && cache.data && Date.now() - cache.at < TTL) return cache.data

  const [el, ap, hg] = await Promise.all([fetchElevenLabs(), fetchApify(), fetchHeyGen()])
  const data = {
    at: new Date().toISOString(),
    services: [
      el,
      ap,
      hg,
      unavailable('fal', 'https://fal.ai/dashboard/billing'),
      unavailable('google_ai_studio', 'https://aistudio.google.com/app/billing'),
      unavailable('anthropic', 'https://console.anthropic.com/settings/billing'),
    ],
  }
  data.anyLow = data.services.some(s => s.low)
  cache.at = Date.now()
  cache.data = data
  return data
}
