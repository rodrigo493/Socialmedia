// Autenticação — bcrypt + JWT.
// User/hash armazenado em apps/api/data/auth.json (não vai pro .env)

import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUTH_FILE = path.resolve(__dirname, '..', '..', 'data', 'auth.json')

// JWT secret — se não setado, gera um persistente no auth.json
let _secret = process.env.PANEL_JWT_SECRET || null

async function loadAuth() {
  try {
    const raw = await fs.readFile(AUTH_FILE, 'utf8')
    return JSON.parse(raw)
  } catch { return null }
}

async function saveAuth(data) {
  await fs.mkdir(path.dirname(AUTH_FILE), { recursive: true })
  await fs.writeFile(AUTH_FILE, JSON.stringify(data, null, 2))
}

async function getSecret() {
  if (_secret) return _secret
  const a = await loadAuth()
  if (a?.jwtSecret) { _secret = a.jwtSecret; return _secret }
  // primeira vez: gera e persiste
  _secret = crypto.randomBytes(48).toString('hex')
  const prev = a || {}
  await saveAuth({ ...prev, jwtSecret: _secret })
  return _secret
}

export async function isConfigured() {
  const a = await loadAuth()
  return !!(a?.users && Object.keys(a.users).length > 0)
}

export async function createUser({ username, password }) {
  if (!username || !password) throw new Error('username e password obrigatórios')
  if (password.length < 8) throw new Error('senha mínima 8 caracteres')
  const a = (await loadAuth()) || {}
  a.users = a.users || {}
  const hash = await bcrypt.hash(password, 10)
  a.users[username] = { hash, createdAt: new Date().toISOString() }
  if (!a.jwtSecret) a.jwtSecret = crypto.randomBytes(48).toString('hex')
  _secret = a.jwtSecret
  await saveAuth(a)
  return { ok: true, username }
}

export async function login({ username, password }) {
  const a = await loadAuth()
  const user = a?.users?.[username]
  if (!user) return null
  const ok = await bcrypt.compare(password, user.hash)
  if (!ok) return null
  const secret = await getSecret()
  const token = jwt.sign({ u: username }, secret, { expiresIn: '7d' })
  return { username, token }
}

export async function verifyToken(token) {
  try {
    const secret = await getSecret()
    const p = jwt.verify(token, secret)
    return { username: p.u }
  } catch { return null }
}
