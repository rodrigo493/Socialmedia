// FFmpeg wrapper. Usa o binário que vem com Playwright (já instalado).
// Override com env FFMPEG_PATH se preferir outro.

import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import os from 'node:os'

function findFfmpeg() {
  if (process.env.FFMPEG_PATH && fsSync.existsSync(process.env.FFMPEG_PATH)) return process.env.FFMPEG_PATH
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
  const base = path.join(localAppData, 'ms-playwright')
  if (fsSync.existsSync(base)) {
    const dir = fsSync.readdirSync(base).find(d => d.startsWith('ffmpeg-'))
    if (dir) {
      const exe = path.join(base, dir, process.platform === 'win32' ? 'ffmpeg-win64.exe' : 'ffmpeg-linux')
      if (fsSync.existsSync(exe)) return exe
    }
  }
  return 'ffmpeg' // fallback: PATH
}

const FFMPEG = findFfmpeg()

function run(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG, args, { windowsHide: true })
    let stderr = ''
    proc.stderr.on('data', d => { stderr += d.toString() })
    proc.on('error', reject)
    proc.on('close', code => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-800)}`))
    })
  })
}

// Cola vídeo (mudo) + áudio -> mp4 com áudio. Se áudio for mais curto, pad com silêncio.
// Se áudio for mais longo, corta no comprimento do vídeo (ou troca shortest/longest via opts).
export async function muxVideoAudio({ videoPath, audioPath, outPath, mode = 'longest' }) {
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await run([
    '-y',
    '-i', videoPath,
    '-i', audioPath,
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    mode === 'shortest' ? '-shortest' : '-shortest', // default shortest pra não estender vídeo
    outPath,
  ])
  return { path: outPath }
}

// Junta múltiplos vídeos em um só. Todos precisam ter o mesmo codec/resolução.
export async function concat({ inputs, outPath }) {
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  const listFile = path.join(path.dirname(outPath), `_concat-${Date.now()}.txt`)
  const content = inputs.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n')
  await fs.writeFile(listFile, content)
  try {
    await run(['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', outPath])
  } finally {
    await fs.unlink(listFile).catch(() => {})
  }
  return { path: outPath }
}

// Corta vídeo de start até start+duration (em segundos).
export async function trim({ inputPath, outPath, start = 0, duration }) {
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  const args = ['-y', '-ss', String(start), '-i', inputPath]
  if (duration != null) args.push('-t', String(duration))
  args.push('-c', 'copy', outPath)
  await run(args)
  return { path: outPath }
}

// Força resolução/aspect pra postagem
export async function resize({ inputPath, outPath, width, height }) {
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await run([
    '-y',
    '-i', inputPath,
    '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
    '-c:a', 'copy',
    outPath,
  ])
  return { path: outPath }
}

// Extrai N frames do vídeo como PNGs — útil pro Claude vision analisar vídeo
export async function extractFrames({ inputPath, outDir, count = 4 }) {
  await fs.mkdir(outDir, { recursive: true })
  // pega N frames igualmente distribuídos
  await run([
    '-y',
    '-i', inputPath,
    '-vf', `select='not(mod(n\\,floor(N/${count})))'`,
    '-vsync', 'vfr',
    path.join(outDir, 'frame-%03d.png'),
  ])
  const files = (await fs.readdir(outDir)).filter(f => f.startsWith('frame-')).sort()
  return files.map(f => path.join(outDir, f))
}

export function binary() { return FFMPEG }
