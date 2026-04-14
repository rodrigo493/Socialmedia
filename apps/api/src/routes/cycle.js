// Ciclo de produção do squad — dispara N peças de conteúdo automaticamente.
// Henrique-Horizonte seria o responsável (ou regra simples pré-configurada).
// Para cada item gerado, cria .item.json com autoGenerate=true disparando mídia.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')

const DEFAULT_MIX = [
  // 7 dias de conteúdo padrão — mix de formatos
  { type: 'carousel',   agent: 'caio-carrossel',  title: 'Capacidade instalada: o erro que trava o próximo nível',    topic: 'gestão de studio' },
  { type: 'reel',       agent: 'davi-destaque',   title: 'Primeira aula no V12: expectativa vs realidade',              voiceText: 'Achou que Pilates era leve? Veja o que acontece quando um fisiculturista entra no V12 pela primeira vez.' },
  { type: 'carousel',   agent: 'caio-carrossel',  title: 'Precificação não é planilha. É posicionamento.',              topic: 'pricing' },
  { type: 'story',      agent: 'elisa-efemera',   title: 'Bastidor: montagem de studio com linha V12',                  frames: 4 },
  { type: 'reel',       agent: 'davi-destaque',   title: 'R$80k me deu mais medo que meu primeiro parto',               voiceText: 'Investir R$80 mil em equipamento me deu mais medo que meu primeiro parto. Mas aqui estou. Ana Paula Studio, 120 alunos ativos.' },
  { type: 'carousel',   agent: 'caio-carrossel',  title: 'Seu studio lota e seu faturamento não acompanha? O problema é arquitetura', topic: 'crescimento' },
  { type: 'influencer_brief', agent: 'iris-influencer', title: 'Persona Digital · Ana Lua Prado', archetype: 'morena-cinema' },
]

export default async function cycleRoutes(app) {
  // GET: status do ciclo (quantos itens em generating, etc.)
  app.get('/api/v1/cycle/status', async () => {
    const CRIADOS = path.join(ROOT, 'squads', 'live-social-media', 'output', 'criados')
    try {
      const files = await fs.readdir(CRIADOS)
      const items = []
      for (const f of files) {
        if (!f.endsWith('.item.json')) continue
        try {
          const it = JSON.parse(await fs.readFile(path.join(CRIADOS, f), 'utf8'))
          items.push({ id: it.id, status: it.status, type: it.type, agent: it.agent })
        } catch {}
      }
      return {
        total: items.length,
        generating: items.filter(i => i.status === 'generating').length,
        pending_approval: items.filter(i => i.status === 'pending_approval').length,
        posted: items.filter(i => i.status === 'posted').length,
      }
    } catch { return { total: 0, generating: 0, pending_approval: 0, posted: 0 } }
  })

  // POST: dispara um ciclo completo (7 peças por padrão).
  // Body: { mix?: [{ type, agent, title, ... }], count?: number }
  app.post('/api/v1/cycle/start', async (req, reply) => {
    const { mix, count } = req.body || {}
    const plan = Array.isArray(mix) && mix.length ? mix : DEFAULT_MIX.slice(0, count || DEFAULT_MIX.length)
    const PORT = process.env.PORT || 3000

    const created = []
    for (const spec of plan) {
      try {
        const body = {
          ...spec,
          caption: spec.caption || spec.title,
          autoGenerate: true,
          ...(spec.type === 'carousel' && !spec.slides ? {
            slides: buildDefaultSlides(spec.title, spec.topic),
          } : {}),
        }
        const res = await fetch(`http://localhost:${PORT}/api/v1/items`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })
        const item = await res.json()
        created.push({ id: item.id, type: item.type, agent: item.agent, title: item.title })
      } catch (err) {
        created.push({ error: String(err.message || err), spec })
      }
      // pequeno delay entre criações pra não saturar
      await new Promise(r => setTimeout(r, 300))
    }

    return {
      ok: true,
      message: `${created.length} peças enfileiradas. Acompanhe em /criados.`,
      items: created,
    }
  })
}

function buildDefaultSlides(title, topic) {
  return [
    { idx: 1, headline: title, sub: 'A Live Universe explica.' },
    { idx: 2, headline: '01 · O diagnóstico', sub: `Onde a maioria dos studios trava em ${topic || 'gestão'}.` },
    { idx: 3, headline: '02 · O custo invisível', sub: 'Cada dia perdido sai caro.' },
    { idx: 4, headline: '03 · A jogada certa', sub: 'Três movimentos que destravam o próximo nível.' },
    { idx: 5, headline: 'Comenta LIVE', sub: 'Diagnóstico gratuito no seu direct.' },
  ]
}
