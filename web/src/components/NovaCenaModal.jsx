import { useEffect, useState } from 'react'

// Modal que dispara /api/v1/studio/persona-usa-produto
// - persona: escolhe de faces existentes em Criados (items influencer_brief com media)
// - produto: do catálogo /api/v1/products
// - cena + voz: texto livre
export default function NovaCenaModal({ onClose, onCreated }) {
  const [products, setProducts] = useState([])
  const [personas, setPersonas] = useState([])
  const [form, setForm] = useState({
    personaImage: '',
    productSlug: '',
    sceneHint: 'Studio premium com iluminação natural suave, plano médio cinematográfico.',
    voiceText: '',
    gender: 'female',
    duration: 5,
    mode: 'scene',
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  useEffect(() => {
    fetch('/api/v1/products').then(r => r.json()).then(setProducts).catch(() => {})
    fetch('/api/v1/items').then(r => r.json()).then(items => {
      const faces = []
      for (const it of items) {
        if (!Array.isArray(it.media)) continue
        for (const m of it.media) {
          if (m.role === 'face_base' || m.role === 'character_sheet') {
            faces.push({
              itemId: it.id,
              label: `${it.title || it.id} · ${m.angle || m.role}`,
              path: m.path, // ex: "<id>/face-base.png"
            })
          }
        }
      }
      setPersonas(faces)
    }).catch(() => {})
  }, [])

  async function submit() {
    if (!form.productSlug) { setErr('Escolha um produto'); return }
    if (form.mode === 'scene' && !form.personaImage) { setErr('Escolha uma persona'); return }
    if (form.mode === 'talking-head' && !form.voiceText) { setErr('Talking head precisa de fala'); return }
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/v1/studio/persona-usa-produto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'erro')
      onCreated?.(body.item)
      onClose?.()
    } catch (e) {
      setErr(e.message)
    } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="relative max-w-3xl w-full bg-coal border border-wire bracketed text-paper">
        <span className="br-tl" /><span className="br-tr" /><span className="br-bl" /><span className="br-br" />

        <div className="px-8 py-6 border-b border-wire flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-onair">Studio</div>
            <h2 className="font-display italic text-3xl text-paper mt-1">Nova cena · persona usa produto</h2>
          </div>
          <button onClick={onClose} className="font-mono text-[11px] uppercase tracking-[0.22em] text-dust hover:text-paper">✕</button>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* Modo */}
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-2">Modo de geração</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setForm(f => ({ ...f, mode: 'scene' }))}
                className={`text-left p-4 border transition-colors ${form.mode === 'scene' ? 'border-paper bg-paper/5' : 'border-wire hover:border-paper'}`}>
                <div className="font-mono text-[10px] uppercase tracking-widest text-onair mb-1">cena (Kling)</div>
                <div className="font-display italic text-lg text-paper">Persona usando o produto</div>
                <div className="text-xs text-dust mt-1">Vídeo cinematográfico 5–10s, opcional voz em off</div>
              </button>
              <button onClick={() => setForm(f => ({ ...f, mode: 'talking-head' }))}
                className={`text-left p-4 border transition-colors ${form.mode === 'talking-head' ? 'border-paper bg-paper/5' : 'border-wire hover:border-paper'}`}>
                <div className="font-mono text-[10px] uppercase tracking-widest text-amber mb-1">talking head (HeyGen)</div>
                <div className="font-display italic text-lg text-paper">Avatar falando direto</div>
                <div className="text-xs text-dust mt-1">Lip-sync perfeito, duração = comprimento da fala</div>
              </button>
            </div>
          </div>

          {/* Persona (só em mode=scene) */}
          {form.mode === 'scene' && (
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-2">Persona (rosto de referência)</label>
            {personas.length === 0 ? (
              <div className="border border-amber/40 bg-amber/10 text-amber font-mono text-xs p-3">
                Nenhuma face gerada. Vá no Chat, peça à iris-influencer, clique Criar → Gerar imagens.
              </div>
            ) : (
              <select value={form.personaImage} onChange={e => setForm(f => ({ ...f, personaImage: e.target.value }))}
                className="w-full bg-ink border border-wire text-paper p-2.5 font-sans text-sm focus:outline-none focus:border-paper">
                <option value="">— selecione —</option>
                {personas.map(p => <option key={p.itemId + p.path} value={p.path}>{p.label}</option>)}
              </select>
            )}
            {form.personaImage && <img src={`/media/criados/${form.personaImage}`} className="mt-2 w-32 h-40 object-cover border border-wire" />}
          </div>
          )}

          {/* Persona bloqueada no modo scene abaixo */}
          <div className="hidden">
          </div>

          {/* Produto */}
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-2">Produto (do catálogo)</label>
            {products.length === 0 ? (
              <div className="border border-amber/40 bg-amber/10 text-amber font-mono text-xs p-3">
                Nenhum produto cadastrado. Vá em Produtos → + Novo produto, depois suba as fotos.
              </div>
            ) : (
              <select
                value={form.productSlug}
                onChange={e => setForm(f => ({ ...f, productSlug: e.target.value }))}
                className="w-full bg-ink border border-wire text-paper p-2.5 font-sans text-sm focus:outline-none focus:border-paper"
              >
                <option value="">— selecione —</option>
                {products.map(p => (
                  <option key={p.slug} value={p.slug}>{p.name || p.slug} · {p.category || '—'}</option>
                ))}
              </select>
            )}
          </div>

          {/* Cena (só scene) */}
          {form.mode === 'scene' && (
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-2">Descrição da cena</label>
            <textarea value={form.sceneHint} onChange={e => setForm(f => ({ ...f, sceneHint: e.target.value }))} rows={3}
              className="w-full bg-ink border border-wire text-paper p-2.5 font-sans text-sm focus:outline-none focus:border-paper resize-none" />
          </div>
          )}

          {/* Voz */}
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-2">Fala (opcional · ElevenLabs)</label>
            <textarea
              value={form.voiceText}
              onChange={e => setForm(f => ({ ...f, voiceText: e.target.value }))}
              rows={3}
              className="w-full bg-ink border border-wire text-paper p-2.5 font-sans text-sm focus:outline-none focus:border-paper resize-none"
              placeholder="Deixe vazio para não gerar voz. Ex: Oi, eu sou a Ana Lua. Esse é o Reformer V12 que transformou meu studio."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-2">Voz</label>
              <div className="flex gap-2">
                {['female','male'].map(g => (
                  <button key={g} onClick={() => setForm(f => ({ ...f, gender: g }))}
                    className={`flex-1 font-mono text-[11px] uppercase tracking-[0.22em] px-3 py-2 border transition-colors
                      ${form.gender === g ? 'border-paper text-paper bg-paper/5' : 'border-wire text-dust hover:text-paper'}`}>
                    {g === 'female' ? 'feminina' : 'masculina'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-2">Duração</label>
              <div className="flex gap-2">
                {[5, 10].map(d => (
                  <button key={d} onClick={() => setForm(f => ({ ...f, duration: d }))}
                    className={`flex-1 font-mono text-[11px] uppercase tracking-[0.22em] px-3 py-2 border transition-colors
                      ${form.duration === d ? 'border-paper text-paper bg-paper/5' : 'border-wire text-dust hover:text-paper'}`}>
                    {d}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {err && <div className="font-mono text-[11px] uppercase tracking-widest text-onair border border-onair/60 p-3">erro: {err}</div>}

          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust">
            {form.mode === 'scene'
              ? <>Custo estimado: <span className="text-paper">~$0.25 Kling</span>{form.voiceText ? <> + <span className="text-paper">~$0.01 voz</span></> : ''}. Tempo: ~1–2 min.</>
              : <>Custo: segundos do plano HeyGen. Tempo: ~1–3 min.</>}
          </div>
        </div>

        <div className="px-8 py-5 border-t border-wire flex items-center justify-end gap-3">
          <button onClick={onClose} className="font-mono text-[11px] uppercase tracking-[0.22em] text-dust border border-wire px-4 py-2.5 hover:text-paper hover:border-paper">
            cancelar
          </button>
          <button
            onClick={submit}
            disabled={busy || !form.personaImage || !form.productSlug}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper bg-onair border border-onair px-6 py-2.5 hover:bg-[#C9241E] disabled:opacity-40"
          >
            {busy ? '◐ gerando vídeo…' : 'Gerar cena →'}
          </button>
        </div>
      </div>
    </div>
  )
}
