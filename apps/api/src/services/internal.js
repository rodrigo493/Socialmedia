import crypto from 'node:crypto'
// Token estável por processo — se INTERNAL_TOKEN estiver no env, usa ele; senão gera
export const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || crypto.randomBytes(32).toString('hex')
