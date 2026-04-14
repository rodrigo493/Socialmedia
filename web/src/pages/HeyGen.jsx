import { useEffect, useState } from 'react'

export default function HeyGen() {
  const [avatars, setAvatars] = useState([])
  const [voices, setVoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [voiceId, setVoiceId] = useState('')
  const [text, setText] = useState('Olá, eu sou a Ana Lua da Live Equipamentos. Se o seu studio tá lotando e o faturamento não acompanha, o problema não é demanda — é arquitetura.')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/heygen/avatars').then(r => r.json()).catch(() => []),
      fetch('/api/v1/heygen/voices').then(r => r.json()).catch(() => []),
    ]).then(([av, vo]) => {
      setAvatars(Array.isArray(av) ? av : [])
      setVoices(Array.isArray(vo) ? vo : [])
      setLoading(false)
    })
  }, [])

  const list = avatars.filter(a => filter === 'all' || a.gender === filter)

  async function generate() {
    if (!selected) { setErr('escolha um avatar'); return }
    setBusy(true); setErr(null); setResult(null)
    try {
      const res = await fetch('/api/v1/heygen/video', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ avatarId: selected.id, voiceId: voiceId || null, text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'erro')
      setResult(data)
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <section className="pb-8 mb-8 border-b border-wire">
        <div className="rise">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-onair mb-4">HeyGen · Talking Head</div>
          <h1 className="font-display text-[72px] leading-[0.92] font-light tracking-[-0.02em] text-paper">
            Avatares<span className="text-onair">.</span>
          </h1>
          <p className="font-display text-xl italic text-dust max-w-xl mt-5">
            Escolha um avatar, escreva o roteiro, gere vídeo com lip-sync.
          </p>
        </div>
      </section>

      {loading && <div className="py-16 font-display italic text-2xl text-dust text-center">carregando avatares…</div>}

      {!loading && avatars.length === 0 && (
        <div className="py-12 text-center border border-amber/40 bg-amber/5 p-6">
          <div className="font-display italic text-2xl text-paper">Nenhum avatar retornado.</div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-dust mt-2">Verifique HEYGEN_API_KEY e créditos.</div>
        </div>
      )}

      {!loading && avatars.length > 0 && (
        <>
          {/* Filtros */}
          <div className="flex items-center gap-2 mb-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust mr-2">filtrar</span>
            {[['all','Todos'],['female','Feminino'],['male','Masculino']].map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)}
                className={`font-mono text-[11px] uppercase tracking-[0.22em] px-3 py-1.5 border transition-colors
                  ${filter === id ? 'border-paper text-paper' : 'border-wire text-dust hover:text-paper'}`}>
                {label}
              </button>
            ))}
            <span className="font-mono text-[10px] text-dust ml-4">{list.length} avatares</span>
          </div>

          {/* Grid de avatares */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-10">
            {list.map(a => (
              <button key={a.id}
                onClick={() => setSelected(a)}
                className={`border bg-coal hover:border-paper transition-colors overflow-hidden ${selected?.id === a.id ? 'border-onair ring-2 ring-onair' : 'border-wire'}`}>
                <div className="aspect-[3/4] bg-ink relative">
                  {a.preview_image ? (
                    <img src={a.preview_image} alt={a.name} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                  )}
                  {a.premium && <span className="absolute top-1 right-1 font-mono text-[8px] uppercase tracking-widest bg-amber text-ink px-1.5 py-0.5">pro</span>}
                </div>
                <div className="p-2 text-left border-t border-wire">
                  <div className="font-sans text-xs text-paper truncate">{a.name}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-dust">{a.gender || '—'}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Form de geração */}
          <section className="border border-wire bg-coal p-6 bracketed text-paper">
            <span className="br-tl" /><span className="br-tr" /><span className="br-bl" /><span className="br-br" />

            <div className="flex items-start gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-onair mb-1">selecionado</div>
                  <div className="font-display italic text-2xl text-paper">{selected?.name || '— escolha um avatar acima —'}</div>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-1">Voz (opcional)</label>
                  <select value={voiceId} onChange={e => setVoiceId(e.target.value)}
                    className="w-full bg-ink border border-wire text-paper p-2 text-sm font-sans focus:outline-none focus:border-paper">
                    <option value="">— padrão pt-BR feminino —</option>
                    {voices.filter(v => v.language?.toLowerCase().includes('port') || v.language === 'pt').map(v => (
                      <option key={v.id} value={v.id}>{v.name} · {v.language} · {v.gender}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-1">Roteiro</label>
                  <textarea value={text} onChange={e => setText(e.target.value)} rows={5}
                    className="w-full bg-ink border border-wire text-paper p-3 text-sm font-sans focus:outline-none focus:border-paper resize-none" />
                  <div className="font-mono text-[10px] text-dust mt-1">{text.length} chars</div>
                </div>

                <button onClick={generate} disabled={!selected || busy}
                  className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper bg-onair border border-onair px-6 py-3 hover:bg-[#C9241E] disabled:opacity-40">
                  {busy ? '◐ gerando (1–3 min)…' : 'Gerar talking head →'}
                </button>

                {err && <div className="font-mono text-[11px] text-onair border border-onair/60 p-2">erro: {err}</div>}

                {result && (
                  <div className="border border-signal/60 bg-signal/10 p-4">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-signal mb-2">✓ pronto</div>
                    <video src={`/media/criados/${result.relPath}`} controls className="w-full max-w-[300px] border border-wire" />
                    <div className="font-mono text-[10px] text-dust mt-2 break-all">{result.path}</div>
                  </div>
                )}
              </div>

              {selected && (
                <div className="w-64 shrink-0">
                  <div className="aspect-[3/4] border border-wire">
                    {selected.preview_video ? (
                      <video src={selected.preview_video} controls muted loop className="w-full h-full object-cover" />
                    ) : selected.preview_image ? (
                      <img src={selected.preview_image} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-dust mt-2 break-all">id: {selected.id}</div>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
