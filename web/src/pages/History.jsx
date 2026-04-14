import { useEffect, useState } from 'react'
import { networks, typeLabel } from '../data/mock'

export default function History() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [metricsById, setMetricsById] = useState({}) // { id: latestSnapshot }
  const [capturingId, setCapturingId] = useState(null)
  const [showUrlFor, setShowUrlFor] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/items?status=posted')
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setItems(list)
      // carregar últimas métricas em paralelo
      Promise.all(list.map(async it => {
        const tl = await (await fetch(`/api/v1/analytics/${it.id}`)).json()
        const last = tl.timeline?.[tl.timeline.length - 1]
        return { id: it.id, last }
      })).then(arr => {
        const m = {}
        for (const { id, last } of arr) if (last) m[id] = last
        setMetricsById(m)
      })
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function capture(id) {
    setCapturingId(id)
    try {
      const r = await (await fetch(`/api/v1/analytics/${id}/capture`, { method: 'POST' })).json()
      if (r.snapshots?.length) {
        setMetricsById(prev => ({ ...prev, [id]: r.snapshots[r.snapshots.length - 1] }))
      }
      if (r.error) alert(r.error)
    } finally { setCapturingId(null) }
  }

  async function setUrl(id, url, platform) {
    await fetch(`/api/v1/analytics/${id}/url`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url, platform }),
    })
    setShowUrlFor(null)
    load()
  }

  return (
    <div>
      <section className="pb-10 mb-10 border-b border-wire">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-onair mb-5 rise">
          Arquivo de Transmissão
        </div>
        <h1 className="font-display text-[80px] leading-[0.92] font-light tracking-[-0.02em] text-paper rise">
          No <span className="italic">ar</span><span className="text-onair">.</span>
        </h1>
        <p className="font-display text-xl italic text-dust max-w-xl mt-6 rise rise-1">
          Tudo que o squad publicou. Do mais recente ao primeiro take.
        </p>
      </section>

      {loading && <div className="py-16 font-display italic text-2xl text-dust text-center">carregando…</div>}

      {!loading && items.length === 0 && (
        <div className="py-16 font-display italic text-2xl text-dust text-center">Nada publicado ainda.</div>
      )}

      {!loading && items.length > 0 && (
        <div className="border border-wire bracketed text-paper rise rise-2">
          <span className="br-tl" /><span className="br-tr" /><span className="br-bl" /><span className="br-br" />

          <div className="grid grid-cols-[60px_1fr_110px_140px_110px_220px_120px] gap-3 px-5 py-3 border-b border-wire font-mono text-[10px] uppercase tracking-[0.3em] text-dust bg-coal">
            <div>#</div>
            <div>Material</div>
            <div>Tipo</div>
            <div>Redes</div>
            <div>Publicado</div>
            <div>Métricas</div>
            <div className="text-right">Ações</div>
          </div>

          {items.map((m, i) => {
            const snap = metricsById[m.id]
            const urls = (m.publishResults || []).filter(r => r.url).map(r => r.url)
            return (
              <div key={m.id} className="grid grid-cols-[60px_1fr_110px_140px_110px_220px_120px] gap-3 px-5 py-4 border-b border-wire/50 hover:bg-coal/50 items-center">
                <div className="font-mono text-[11px] text-onair">{String(items.length - i).padStart(3, '0')}</div>

                <div>
                  <div className="font-display italic text-lg text-paper leading-tight">{m.title}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-dust mt-0.5">{m.agent}</div>
                </div>

                <div className="font-mono text-[11px] uppercase text-paper">{typeLabel[m.type] || m.type}</div>

                <div className="flex flex-wrap gap-1">
                  {(m.postedTo || []).map(t => {
                    const n = networks.find(x => x.id === t)
                    return <span key={t} className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-wire text-paper">{n?.short || t}</span>
                  })}
                </div>

                <div className="font-mono text-[10px] text-paper">
                  {m.postedAt ? new Date(m.postedAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </div>

                <div>
                  {snap?.metrics ? (
                    <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
                      <Metric label="views" value={snap.metrics.views} />
                      <Metric label="likes" value={snap.metrics.likes} />
                      <Metric label="cmts" value={snap.metrics.comments} />
                    </div>
                  ) : urls.length === 0 ? (
                    <div className="font-mono text-[9px] uppercase tracking-widest text-wire">sem URL</div>
                  ) : (
                    <div className="font-mono text-[9px] uppercase tracking-widest text-dust">sem métricas ainda</div>
                  )}
                  {snap?.at && <div className="font-mono text-[9px] text-dust mt-1">↻ {new Date(snap.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>}
                </div>

                <div className="text-right space-x-1">
                  {urls.length === 0 ? (
                    <button onClick={() => setShowUrlFor(m.id)}
                      className="font-mono text-[10px] uppercase tracking-widest text-amber border border-amber/60 px-2 py-1 hover:bg-amber hover:text-ink">
                      + URL
                    </button>
                  ) : (
                    <>
                      <a href={urls[0]} target="_blank" rel="noreferrer"
                        className="font-mono text-[10px] uppercase tracking-widest text-dust border border-wire px-2 py-1 hover:text-paper hover:border-paper">
                        abrir ↗
                      </a>
                      <button onClick={() => capture(m.id)} disabled={capturingId === m.id}
                        className="font-mono text-[10px] uppercase tracking-widest text-paper border border-onair bg-onair/20 px-2 py-1 hover:bg-onair disabled:opacity-40">
                        {capturingId === m.id ? '…' : '↻ métricas'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showUrlFor && <UrlModal itemId={showUrlFor} onClose={() => setShowUrlFor(null)} onSave={(url, platform) => setUrl(showUrlFor, url, platform)} />}
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="text-dust uppercase tracking-widest text-[9px]">{label}</div>
      <div className="text-paper font-display not-italic text-sm">{value?.toLocaleString('pt-BR') || '—'}</div>
    </div>
  )
}

function UrlModal({ itemId, onClose, onSave }) {
  const [url, setUrl] = useState('')
  const [platform, setPlatform] = useState('auto')
  return (
    <div className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center p-6">
      <div className="bg-coal border border-wire p-6 max-w-md w-full">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-onair mb-2">+ URL do post publicado</div>
        <div className="font-display italic text-xl text-paper mb-4">{itemId}</div>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.instagram.com/p/... ou https://www.tiktok.com/@.../video/..."
          className="w-full bg-ink border border-wire text-paper p-2 text-sm focus:outline-none focus:border-paper font-mono mb-3" />
        <select value={platform} onChange={e => setPlatform(e.target.value)}
          className="w-full bg-ink border border-wire text-paper p-2 text-sm focus:outline-none focus:border-paper font-sans mb-4">
          <option value="auto">auto-detectar</option>
          <option value="instagram_feed">Instagram Feed</option>
          <option value="instagram_reel">Instagram Reel</option>
          <option value="tiktok">TikTok</option>
        </select>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="font-mono text-[11px] uppercase tracking-widest text-dust border border-wire px-4 py-2 hover:text-paper">cancelar</button>
          <button onClick={() => onSave(url, platform === 'auto' ? null : platform)} disabled={!url}
            className="font-mono text-[11px] uppercase tracking-widest text-paper bg-onair border border-onair px-4 py-2 disabled:opacity-40">
            salvar
          </button>
        </div>
      </div>
    </div>
  )
}
