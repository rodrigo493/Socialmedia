// Apify REST API wrapper — Instagram Reel Scraper
// Actor: xMc5Ga1oCONPmWJIa (apify/instagram-reel-scraper)

const TOKEN = process.env.APIFY_TOKEN
const BASE = 'https://api.apify.com/v2'
const REEL_ACTOR = 'xMc5Ga1oCONPmWJIa'

export async function getReels({ username, limit = 20, timeoutSec = 300 }) {
  if (!TOKEN) throw new Error('APIFY_TOKEN faltando no .env')

  const url = `${BASE}/acts/${REEL_ACTOR}/run-sync-get-dataset-items?token=${TOKEN}&timeout=${timeoutSec}&format=json&clean=true`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: [username], resultsLimit: limit }),
    signal: AbortSignal.timeout(timeoutSec * 1000 + 10000),
  })
  if (!res.ok) throw new Error(`Apify ${res.status}: ${await res.text()}`)
  return res.json() // array de reels
}
