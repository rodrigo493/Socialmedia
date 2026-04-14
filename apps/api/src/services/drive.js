// Google Drive via Service Account.
// Configuração:
//  - GOOGLE_SERVICE_ACCOUNT_JSON = caminho absoluto (ou relativo ao backend) do arquivo JSON
//  - GOOGLE_DRIVE_FOLDER_ID      = ID da pasta raiz "Live Marketing" (extraído da URL do Drive)

import { google } from 'googleapis'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'

const KEY_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
const ROOT_FOLDER = process.env.GOOGLE_DRIVE_FOLDER_ID

let _drive = null
async function getDrive() {
  if (_drive) return _drive
  if (!KEY_PATH) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON não configurado')
  const abs = path.isAbsolute(KEY_PATH) ? KEY_PATH : path.resolve(process.cwd(), KEY_PATH)
  const auth = new google.auth.GoogleAuth({
    keyFile: abs,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/calendar',
    ],
  })
  const authClient = await auth.getClient()
  _drive = google.drive({ version: 'v3', auth: authClient })
  return _drive
}

export function isConfigured() {
  return !!KEY_PATH && !!ROOT_FOLDER
}

// Lista arquivos e pastas de um folderId (default: raiz configurada)
export async function list({ folderId, query = '', pageSize = 100 } = {}) {
  const drive = await getDrive()
  const parent = folderId || ROOT_FOLDER
  const q = [
    `'${parent}' in parents`,
    'trashed = false',
    query ? `(name contains '${query.replace(/'/g, "\\'")}')` : '',
  ].filter(Boolean).join(' and ')
  const { data } = await drive.files.list({
    q,
    pageSize,
    fields: 'files(id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink, iconLink, parents)',
    orderBy: 'folder,name',
  })
  return data.files || []
}

// Busca global na árvore da pasta raiz
export async function search(query) {
  const drive = await getDrive()
  const q = `fullText contains '${query.replace(/'/g, "\\'")}' and trashed = false`
  const { data } = await drive.files.list({
    q, pageSize: 50,
    fields: 'files(id, name, mimeType, parents, modifiedTime, thumbnailLink, webViewLink)',
  })
  return data.files || []
}

// Metadata + conteúdo como stream (pra download)
export async function get(fileId) {
  const drive = await getDrive()
  const { data: meta } = await drive.files.get({ fileId, fields: 'id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink, parents' })
  return meta
}

export async function downloadToBuffer(fileId) {
  const drive = await getDrive()
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' })
  return Buffer.from(res.data)
}

export async function upload({ name, mime, buffer, parentId }) {
  const drive = await getDrive()
  const { data } = await drive.files.create({
    requestBody: { name, parents: [parentId || ROOT_FOLDER] },
    media: { mimeType: mime, body: Readable.from(buffer) },
    fields: 'id, name, mimeType, webViewLink, thumbnailLink',
  })
  return data
}

export async function createFolder(name, parentId) {
  const drive = await getDrive()
  const { data } = await drive.files.create({
    requestBody: {
      name, mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId || ROOT_FOLDER],
    },
    fields: 'id, name, webViewLink',
  })
  return data
}

export async function getServiceAccountEmail() {
  if (!KEY_PATH) return null
  try {
    const abs = path.isAbsolute(KEY_PATH) ? KEY_PATH : path.resolve(process.cwd(), KEY_PATH)
    const json = JSON.parse(await fs.readFile(abs, 'utf8'))
    return json.client_email
  } catch { return null }
}
