// Scheduler — a cada POLL_MS consulta o Google Calendar por eventos aprovados
// cuja hora passou e que ainda não foram publicados. Se SCHEDULER_AUTO_PUBLISH=true,
// dispara /publish no item referenciado. Caso contrário, roda em dry-run (apenas loga).

import * as cal from './calendar.js'

const POLL_MS = 60 * 1000
const AUTO = process.env.SCHEDULER_AUTO_PUBLISH === 'true'
const seen = new Set() // eventIds já processados na sessão

let timer = null
let logger = null
let publishHandler = null

export function start({ log, onDue } = {}) {
  logger = log || console
  publishHandler = onDue
  if (timer) return
  timer = setInterval(tick, POLL_MS)
  tick().catch(() => {})
  logger.info?.({ auto: AUTO }, '[scheduler] started')
}

export function stop() {
  if (timer) { clearInterval(timer); timer = null }
}

async function tick() {
  if (!cal.isConfigured()) return
  try {
    const now = new Date()
    const from = new Date(now.getTime() - 60 * 60 * 1000).toISOString() // última hora
    const to = new Date(now.getTime() + 60 * 1000).toISOString()
    const events = await cal.list({ timeMin: from, timeMax: to })

    for (const ev of events) {
      if (seen.has(ev.id)) continue
      if (ev.status !== 'approved') continue
      if (!ev.itemId || !ev.networks?.length) continue
      const when = new Date(ev.startAt)
      if (when > now) continue // ainda não chegou

      seen.add(ev.id)
      logger.info?.({ eventId: ev.id, itemId: ev.itemId, networks: ev.networks, auto: AUTO }, '[scheduler] evento devido')

      if (AUTO && publishHandler) {
        try {
          const result = await publishHandler(ev)
          await cal.update(ev.id, { status: 'posted' })
          logger.info?.({ eventId: ev.id, result }, '[scheduler] publicado')
        } catch (err) {
          logger.error?.({ eventId: ev.id, err: err.message }, '[scheduler] falha na publicação')
          seen.delete(ev.id) // tenta de novo no próximo tick
        }
      }
    }
  } catch (err) {
    logger.warn?.({ err: err.message }, '[scheduler] tick error')
  }
}

export function isAuto() { return AUTO }
