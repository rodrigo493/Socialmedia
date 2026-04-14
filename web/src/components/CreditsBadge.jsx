import { useEffect, useState } from 'react'

export default function CreditsBadge() {
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(false)

  async function load() {
    try {
      const r = await fetch('/api/v1/credits')
      setData(await r.json())
    } catch {}
  }
  useEffect(() => { load(); const t = setInterval(load, 5 * 60 * 1000); return () => clearInterval(t) }, [])

  if (!data) return null

  const alerts = data.services.filter(s => s.status === 'ok' && s.low)
  const tone = alerts.length > 0 ? 'text-onair border-onair' : 'text-signal border-wire'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`font-mono text-[10px] uppercase tracking-[0.25em] px-3 py-2 border transition-colors flex items-center gap-2 ${tone}`}
        title="Créditos das APIs"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${alerts.length ? 'bg-onair onair-dot' : 'bg-signal'}`} />
        {alerts.length > 0 ? `⚠ ${alerts.length} baixo` : 'créditos ok'}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 border border-wire bg-coal shadow-xl z-50">
          <div className="px-4 py-3 border-b border-wire font-mono text-[10px] uppercase tracking-[0.3em] text-dust flex justify-between">
            <span>Saldo dos serviços</span>
            <button onClick={() => load()} className="text-paper hover:text-onair">↻</button>
          </div>
          <ul>
            {data.services.map(s => <CreditRow key={s.service} s={s} />)}
          </ul>
          <div className="px-4 py-2 border-t border-wire font-mono text-[10px] text-dust">
            Atualizado: {new Date(data.at).toLocaleTimeString('pt-BR')}
          </div>
        </div>
      )}
    </div>
  )
}

function CreditRow({ s }) {
  if (s.status === 'no_key') {
    return <li className="px-4 py-2.5 border-b border-wire/50 font-mono text-[10px] text-wire uppercase tracking-wider">{s.service} · sem chave</li>
  }
  if (s.status === 'unavailable') {
    return (
      <li className="px-4 py-2.5 border-b border-wire/50 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-dust">{s.service}</span>
        <a href={s.dashboard} target="_blank" rel="noreferrer" className="font-mono text-[10px] text-paper hover:text-onair">ver dashboard ↗</a>
      </li>
    )
  }
  if (s.status !== 'ok') {
    return <li className="px-4 py-2.5 border-b border-wire/50 font-mono text-[10px] text-onair uppercase">{s.service} · erro</li>
  }
  const label = s.unit === 'chars' ? `${fmt(s.remaining)} chars restantes`
    : s.unit === 'usd' ? `$${s.remaining.toFixed(2)} de $${s.limit.toFixed(2)}`
    : s.unit === 'seconds' ? `${s.remaining}s restantes`
    : '—'
  return (
    <li className={`px-4 py-2.5 border-b border-wire/50 ${s.low ? 'bg-onair/10' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-paper">{s.service}</span>
        <span className={`font-mono text-[10px] ${s.low ? 'text-onair' : 'text-dust'}`}>{label}</span>
      </div>
      {s.pct != null && (
        <div className="mt-1.5 h-[3px] bg-ink overflow-hidden">
          <div className={`h-full ${s.low ? 'bg-onair' : 'bg-signal'}`} style={{ width: `${Math.min(100, s.pct)}%` }} />
        </div>
      )}
    </li>
  )
}

function fmt(n) { return (n || 0).toLocaleString('pt-BR') }
