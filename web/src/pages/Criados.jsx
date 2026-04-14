import { useEffect, useState } from 'react'
import MaterialCard from '../components/MaterialCard'
import NovaCenaModal from '../components/NovaCenaModal'
import { typeLabel } from '../data/mock'

function needsGeneration(item) {
  if (item.status === 'generating') return 'generating'
  const gens = ['carousel', 'influencer_brief', 'reel', 'tiktok']
  if (gens.includes(item.type) && (!item.media || item.media.length === 0)) return 'pending'
  return null
}

export default function Criados() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [type, setType] = useState('all')

  async function load() {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/items')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
      setError(null)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const list = items.filter(m => type === 'all' || m.type === type)
  const [showNova, setShowNova] = useState(false)

  return (
    <div>
      <section className="pb-10 mb-10 border-b border-wire">
        <div className="flex items-end justify-between gap-8">
          <div className="rise">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-onair mb-5">
              Laboratório · Rascunhos do Chat
            </div>
            <h1 className="font-display text-[80px] leading-[0.92] font-light tracking-[-0.02em] text-paper">
              Criados<span className="text-onair">.</span>
            </h1>
            <p className="font-display text-xl italic text-dust max-w-xl mt-5">
              Tudo que os agentes rascunharam. Revise, escolha as redes, publique.
            </p>
          </div>
          <div className="rise rise-1 flex items-end gap-6">
            <div className="text-right">
              <div className="font-display text-6xl font-light text-paper leading-none">{String(items.length).padStart(2,'0')}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust mt-2">drafts totais</div>
            </div>
            <button
              onClick={() => setShowNova(true)}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper bg-onair border border-onair px-4 py-3 hover:bg-[#C9241E]"
            >
              + Nova cena · persona + produto
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4 mb-8 rise rise-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust mr-2">Tipo</span>
        {['all', 'carousel', 'reel', 'story', 'influencer_brief'].map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`font-mono text-[11px] uppercase tracking-[0.22em] px-3 py-1.5 border transition-colors
              ${type === t ? 'border-paper text-paper' : 'border-wire text-dust hover:text-paper'}`}>
            {t === 'all' ? 'Tudo' : typeLabel[t] || t}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={load} className="font-mono text-[11px] uppercase tracking-[0.22em] text-dust border border-wire px-3 py-1.5 hover:text-paper hover:border-paper">
          ↻ atualizar
        </button>
      </div>

      {loading && <div className="py-20 text-center font-display italic text-2xl text-dust">Carregando…</div>}
      {error && <div className="py-20 text-center font-mono text-[11px] uppercase tracking-widest text-onair">Erro: {error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {list.map((m, i) => (
            <div key={m.id} className="relative">
              <MaterialCard m={m} index={i} />
              <GenerateBar item={m} onDone={load} />
            </div>
          ))}
        </div>
      )}

      {showNova && <NovaCenaModal onClose={() => setShowNova(false)} onCreated={load} />}

      {!loading && !error && list.length === 0 && (
        <div className="py-24 text-center">
          <div className="font-display italic text-3xl text-dust">Nada criado ainda.</div>
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-wire mt-3">Vá no Chat, peça uma ideia, clique em "Criar".</div>
        </div>
      )}
    </div>
  )
}

function GenerateBar({ item, onDone }) {
  const state = needsGeneration(item)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  if (!state && item.media?.length > 0) {
    return (
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-signal">
        <span>✓ {item.media.length} mídia(s) geradas</span>
      </div>
    )
  }

  async function generate() {
    setBusy(true); setErr(null)
    try {
      const res = await fetch(`/api/v1/items/${item.id}/generate-media`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'erro')
      onDone?.()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="mt-2">
      <button
        onClick={generate}
        disabled={busy || state === 'generating'}
        className="w-full font-mono text-[11px] uppercase tracking-[0.22em] text-paper bg-onair border border-onair px-3 py-2 hover:bg-[#C9241E] disabled:opacity-50"
      >
        {busy || state === 'generating' ? '◐ gerando imagens (Nano Banana)…' : 'Gerar imagens →'}
      </button>
      {err && <div className="text-onair font-mono text-[10px] mt-1">erro: {err}</div>}
    </div>
  )
}
