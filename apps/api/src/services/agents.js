// Agent registry + keyword-based router.
// Especialidade -> palavra-chave. O que mais casar ganha a resposta.

import fs from 'node:fs/promises'
import path from 'node:path'

export const AGENTS = [
  { id: 'caio-carrossel',    icon: '🃏', role: 'Carrosséis de feed',       keywords: ['carrossel','feed','slides','slide','post de imagem','carousel'] },
  { id: 'davi-destaque',     icon: '🎬', role: 'Reels & vídeos curtos',    keywords: ['reel','reels','video curto','vídeo curto','tiktok','shorts','gravação','roteiro'] },
  { id: 'elisa-efemera',     icon: '✨', role: 'Stories',                  keywords: ['story','stories','24h','efêmero','bastidor'] },
  { id: 'giovana-gancho',    icon: '🪝', role: 'Ganchos & copy',           keywords: ['gancho','hook','copy','headline','título','legenda','caption','frase'] },
  { id: 'henrique-horizonte', icon: '🗺️', role: 'Planejamento mensal',     keywords: ['planejamento','mês','calendário','linha editorial','estratégia','horizonte'] },
  { id: 'fabio-funil',       icon: '🔻', role: 'Funil & oferta',           keywords: ['funil','oferta','conversão','lead','venda','cta'] },
  { id: 'amanda-anuncio',    icon: '📢', role: 'Criativos de anúncio',     keywords: ['anúncio','anuncio','ads','tráfego pago','meta ads','performance','criativo'] },
  { id: 'iris-influencer',   icon: '🧬', role: 'Criadora de Personas Digitais (IA)', keywords: ['influencer','influenciador','persona','persona digital','character sheet','personagem','virtual','ia','ai','digital','veo','veo 3','google ai studio','creator','avatar','ugc'] },
  { id: 'bruno-balizador',   icon: '🛡️', role: 'Revisão de marca',         keywords: ['revisão','revisar','revisao','marca','brand','checar','validar','tom de voz'] },
  { id: 'paula-postagem',    icon: '📤', role: 'Publicação',              keywords: ['postar','publicar','publicação','agendar','cronograma','subir'] },
]

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..', '..', '..')
const AGENT_DIR = path.join(ROOT, 'squads', 'live-social-media', 'agents')

const personaCache = new Map()
export async function loadPersona(id) {
  if (personaCache.has(id)) return personaCache.get(id)
  try {
    const p = path.join(AGENT_DIR, `${id}.agent.md`)
    const raw = await fs.readFile(p, 'utf8')
    personaCache.set(id, raw)
    return raw
  } catch { return '' }
}

export function score(text, agent) {
  const t = text.toLowerCase()
  let s = 0
  for (const k of agent.keywords) if (t.includes(k.toLowerCase())) s += 2
  return s
}

// Devolve [primario, ...outros] rankeados. Empate vira primeiro da lista.
export function route(text) {
  const ranked = AGENTS
    .map(a => ({ agent: a, s: score(text, a) }))
    .sort((x, y) => y.s - x.s)
  const primary = ranked[0].s > 0 ? ranked[0].agent : AGENTS.find(a => a.id === 'giovana-gancho')
  const supporters = ranked.filter(r => r.s > 0 && r.agent.id !== primary.id).slice(0, 2).map(r => r.agent)
  return { primary, supporters }
}
