// Google Calendar via mesma Service Account do Drive.
// Configuração:
//   GOOGLE_SERVICE_ACCOUNT_JSON = caminho do JSON (já existe)
//   GOOGLE_CALENDAR_ID          = ID do calendário compartilhado com a SA

import { google } from 'googleapis'
import path from 'node:path'

const KEY_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID

let _cal = null
async function getCal() {
  if (_cal) return _cal
  if (!KEY_PATH) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON não configurado')
  const abs = path.isAbsolute(KEY_PATH) ? KEY_PATH : path.resolve(process.cwd(), KEY_PATH)
  const auth = new google.auth.GoogleAuth({
    keyFile: abs,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
  const authClient = await auth.getClient()
  _cal = google.calendar({ version: 'v3', auth: authClient })
  return _cal
}

export function isConfigured() { return !!KEY_PATH && !!CALENDAR_ID }

export async function list({ timeMin, timeMax }) {
  const cal = await getCal()
  const { data } = await cal.events.list({
    calendarId: CALENDAR_ID,
    timeMin: timeMin || new Date().toISOString(),
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  })
  return (data.items || []).map(normalize)
}

export async function create({ title, description, startAt, endAt, itemId, networks = [], status = 'scheduled', colorId }) {
  const cal = await getCal()
  const { data } = await cal.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary: title,
      description,
      start: { dateTime: startAt, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: endAt || new Date(new Date(startAt).getTime() + 30 * 60 * 1000).toISOString(), timeZone: 'America/Sao_Paulo' },
      colorId: colorId || colorForStatus(status),
      extendedProperties: {
        private: {
          liveSocial: '1',
          itemId: itemId || '',
          networks: networks.join(','),
          status,
        },
      },
    },
  })
  return normalize(data)
}

export async function update(eventId, patch) {
  const cal = await getCal()
  const existing = await cal.events.get({ calendarId: CALENDAR_ID, eventId })
  const ext = existing.data.extendedProperties?.private || {}

  const body = {}
  if (patch.title) body.summary = patch.title
  if (patch.description != null) body.description = patch.description
  if (patch.startAt) body.start = { dateTime: patch.startAt, timeZone: 'America/Sao_Paulo' }
  if (patch.endAt) body.end = { dateTime: patch.endAt, timeZone: 'America/Sao_Paulo' }
  if (patch.colorId) body.colorId = patch.colorId
  if (patch.status || patch.itemId != null || patch.networks) {
    body.extendedProperties = {
      private: {
        ...ext,
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.itemId != null ? { itemId: patch.itemId } : {}),
        ...(patch.networks ? { networks: patch.networks.join(',') } : {}),
        liveSocial: '1',
      },
    }
    if (patch.status) body.colorId = body.colorId || colorForStatus(patch.status)
  }

  const { data } = await cal.events.patch({ calendarId: CALENDAR_ID, eventId, requestBody: body })
  return normalize(data)
}

export async function remove(eventId) {
  const cal = await getCal()
  await cal.events.delete({ calendarId: CALENDAR_ID, eventId })
  return { ok: true }
}

function colorForStatus(s) {
  return { scheduled: '6', /* tangerine */ approved: '2' /* green */, posted: '8' /* graphite */, draft: '7' /* blue */ }[s] || '1'
}

function normalize(ev) {
  const ext = ev.extendedProperties?.private || {}
  return {
    id: ev.id,
    title: ev.summary || '(sem título)',
    description: ev.description || '',
    startAt: ev.start?.dateTime || ev.start?.date,
    endAt: ev.end?.dateTime || ev.end?.date,
    colorId: ev.colorId,
    itemId: ext.itemId || null,
    networks: ext.networks ? ext.networks.split(',').filter(Boolean) : [],
    status: ext.status || 'scheduled',
    htmlLink: ev.htmlLink,
  }
}
