import { useEffect, useState } from 'react'
import MaterialCard from '../components/MaterialCard'
import { typeLabel } from '../data/mock'

const filters = [
  { id: 'all', label: 'Tudo' },
  { id: 'generating', label: 'Gerando' },
  { id: 'pending_approval', label: 'Aguardando' },
  { id: 'approved', label: 'Aprovado' },
  { id: 'posted', label: 'Publicado' },
]

export default function Inbox() {
  const [filter, setFilter] = useState('all')
  const [type, setType] = useState('all')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [toast, setToast] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/items')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  // Refresh quando tiver items em geração (poll a cada 15s)
  useEffect(() => {
    if (!items.some(i => i.status === 'generating')) return
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [items])

  const counts = {
    generating: items.filter(i => i.status === 'generating').length,
    pending: items.filter(i => i.status === 'pending_approval').length,
    approved: items.filter(i => i.status === 'approved').length,
    posted: items.filter(i => i.status === 'posted').length,
  }

  const list = items.filter(m =>
    (filter === 'all' || m.status === filter) &&
    (type === 'all' || m.type === type)
  )

  async function startCycle() {
    if (!confirm('Iniciar ciclo de produção — o squad vai gerar 7 peças (carrosséis, reels, story, persona). Vai consumir créditos de Nano Banana + Veo + ElevenLabs. Continuar?')) return
    setStarting(true)
    try {
      const r = await (await fetch('/api/v1/cycle/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).json()
      setToast(r.message || 'ciclo iniciado')
      setTimeout(() => setToast(null), 10000)
      load()
    } finally { setStarting(false) }
  }

  return (
    <div>
      <section className="relative pb-10 mb-10 border-b border-wire">
        <div className="flex items-start justify-between gap-8">
          <div className="rise">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-onair mb-5">
              Edição · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <h1 className="font-display text-[88px] leading-[0.92] font-light tracking-[-0.02em] text-paper">
              Control<br /><span className="italic">Room</span><span className="text-onair">.</span>
            </h1>
            <p className="font-display text-xl italic text-dust max-w-xl mt-6">
              Tudo que o squad entregou. Aprove, escolha as redes, publique.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <button onClick={startCycle} disabled={starting}
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper bg-onair border border-onair px-5 py-3 hover:bg-[#C9241E] disabled:opacity-40">
                {starting ? 'iniciando…' : '▶ Iniciar ciclo de produção (7 peças)'}
              </button>
              <button onClick={load}
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-dust border border-wire px-4 py-3 hover:text-paper hover:border-paper">
                ↻ atualizar
              </button>
            </div>
            {toast && <div className="mt-3 font-mono text-[11px] uppercase tracking-widest text-signal border border-signal/60 p-2 inline-block">{toast}</div>}
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 rise rise-2">
            <Stat n={counts.generating} label="Gerando" tone="amber" pulse={counts.generating > 0} />
            <Stat n={counts.pending} label="Aguardando" tone="amber" />
            <Stat n={counts.approved} label="Aprovados" tone="signal" />
            <Stat n={counts.posted} label="No ar" tone="paper" />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-6 mb-8 rise rise-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust mr-2">Status</span>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`font-mono text-[11px] uppercase tracking-[0.22em] px-3 py-1.5 border transition-colors
                ${filter === f.id ? 'border-paper text-paper' : 'border-wire text-dust hover:text-paper'}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-wire" />

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust mr-2">Tipo</span>
          {['all', 'carousel', 'reel', 'story', 'influencer_brief'].map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`font-mono text-[11px] uppercase tracking-[0.22em] px-3 py-1.5 border transition-colors
                ${type === t ? 'border-paper text-paper' : 'border-wire text-dust hover:text-paper'}`}>
              {t === 'all' ? 'Tudo' : typeLabel[t] || t}
            </button>
          ))}
        </div>

        <div className="flex-1" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust">
          {list.length} {list.length === 1 ? 'material' : 'materiais'}
        </span>
      </div>

      {loading && <div className="py-16 font-display italic text-2xl text-dust text-center">carregando…</div>}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {list.map((m, i) => <MaterialCard key={m.id} m={m} index={i} />)}
        </div>
      )}

      {!loading && list.length === 0 && (
        <div className="py-32 text-center">
          <div className="font-display italic text-3xl text-dust">Sem material no filtro atual.</div>
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-wire mt-3">Inicie um ciclo de produção ou use o Chat.</div>
        </div>
      )}
    </div>
  )
}

function Stat({ n, label, tone, pulse }) {
  const color = tone === 'amber' ? 'text-amber' : tone === 'signal' ? 'text-signal' : 'text-paper'
  return (
    <div className="text-right">
      <div className={`font-display text-5xl font-light leading-none ${color} ${pulse ? 'onair-dot rounded-full' : ''}`}>
        {String(n).padStart(2, '0')}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust mt-2">{label}</div>
    </div>
  )
}
