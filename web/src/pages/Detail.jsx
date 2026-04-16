import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { typeLabel } from '../data/mock'
import NetworkSelector from '../components/NetworkSelector'
import { InstagramFeedPreview, InstagramStoryPreview, TikTokPreview, LinkedInPreview } from '../components/Previews'

const allowedFor = {
  carousel: ['instagram_feed', 'linkedin'],
  reel: ['instagram_reel', 'tiktok'],
  tiktok: ['tiktok', 'instagram_reel'],
  story: ['instagram_story'],
  influencer_brief: [],
}

export default function Detail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [m, setM] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [publishing, setPublishing] = useState(false)
  const [done, setDone] = useState(false)
  const [caption, setCaption] = useState('')
  const [error, setError] = useState(null)
  const [allProducts, setAllProducts] = useState([])
  const [suggested, setSuggested] = useState({ source: null, products: [] })
  const [showProductPicker, setShowProductPicker] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const r = await fetch(`/api/v1/items/${id}`)
      if (!r.ok) { setM(null); return }
      const item = await r.json()
      setM(item)
      setSelected(item.targets || [])
      setCaption(item.caption || '')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [id])

  // Lista geral de produtos (para o picker)
  useEffect(() => {
    fetch('/api/v1/products').then(r => r.json()).then(setAllProducts).catch(() => {})
  }, [])

  // Pede sugestao quando item carrega ou productSlugs muda
  useEffect(() => {
    if (!m) return
    fetch('/api/v1/products/suggest', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: m.title, caption: m.caption, script: m.script,
        voiceText: m.voiceText, topic: m.topic, productSlugs: m.productSlugs,
      }),
    }).then(r => r.json()).then(setSuggested).catch(() => {})
  }, [m?.id, m?.productSlugs])

  // Poll enquanto tiver gerando
  useEffect(() => {
    if (m?.status !== 'generating') return
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [m?.status, id])

  async function setProductSlugs(slugs) {
    await fetch(`/api/v1/items/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productSlugs: slugs }),
    })
    load()
  }

  if (loading) return <div className="py-32 text-center font-display italic text-2xl text-dust">carregando…</div>

  if (!m) {
    return (
      <div className="py-32 text-center">
        <div className="font-display italic text-4xl text-dust">Material não encontrado.</div>
        <Link to="/" className="font-mono text-[11px] uppercase tracking-[0.3em] text-onair mt-6 inline-block">← voltar ao inbox</Link>
      </div>
    )
  }

  const canPublish = selected.length > 0 && !publishing && !done && m.status !== 'generating' && m.status !== 'error'
  const allowed = allowedFor[m.type] || []

  async function handlePublish() {
    setPublishing(true); setError(null)
    try {
      // Salva caption atualizada
      await fetch(`/api/v1/items/${id}`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ caption }),
      })
      // Publica
      const r = await fetch(`/api/v1/items/${id}/publish`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targets: selected }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'erro ao publicar')
      setDone(true)
      setTimeout(() => load(), 500)
    } catch (err) {
      setError(err.message)
    } finally { setPublishing(false) }
  }

  async function handleReject() {
    if (!confirm('Deletar esse material? Essa ação não pode ser desfeita.')) return
    await fetch(`/api/v1/items/${id}`, { method: 'DELETE' })
    nav('/criados')
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-dust mb-8 rise">
        <Link to="/" className="hover:text-paper transition-colors">Inbox</Link>
        <span className="text-wire">/</span>
        <span className="text-paper">{typeLabel[m.type]}</span>
        <span className="text-wire">/</span>
        <span className="text-dust truncate max-w-md">{m.id}</span>
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Left: meta + caption + actions */}
        <aside className="col-span-12 lg:col-span-4 space-y-8 rise rise-1">
          {/* Title */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-onair mb-3">
              {typeLabel[m.type]} · {m.agent}
            </div>
            <h1 className="font-display text-[42px] italic font-light leading-[1.05] text-paper">
              {m.title}
            </h1>
          </div>

          {/* Status banner */}
          {m.status === 'generating' && (
            <div className="border border-amber/60 bg-amber/10 p-4 font-mono text-[11px] uppercase tracking-widest text-amber">
              ◐ Gerando mídia em segundo plano… atualiza automaticamente.
            </div>
          )}
          {m.status === 'error' && (
            <div className="border border-onair/60 bg-onair/10 p-4">
              <div className="font-mono text-[11px] uppercase tracking-widest text-onair mb-1">erro na geração</div>
              <div className="font-mono text-[10px] text-dust whitespace-pre-wrap">{m.lastError?.slice(0, 400)}</div>
            </div>
          )}

          {/* Caption */}
          <div className="border-t border-wire pt-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust mb-3">Legenda</div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="w-full bg-coal border border-wire text-paper text-[14px] leading-relaxed p-4 min-h-[180px] focus:outline-none focus:border-paper font-sans"
            />
            <div className="flex items-center justify-between mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-dust">
              <span>{caption.length} / 2200 chars</span>
              <span>{m.hashtags?.length || 0} hashtags</span>
            </div>
          </div>

          {/* Networks */}
          <div className="border-t border-wire pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust">Publicar em</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-paper">
                {selected.length} {selected.length === 1 ? 'rede' : 'redes'}
              </div>
            </div>
            <NetworkSelector value={selected} onChange={setSelected} allowed={allowed.length ? allowed : undefined} />
          </div>

          {/* Publish button */}
          <div className="border-t border-wire pt-6">
            <button
              onClick={handlePublish}
              disabled={!canPublish}
              className={`relative w-full group overflow-hidden border px-6 py-6 text-left transition-all
                ${canPublish
                  ? 'border-onair bg-onair hover:bg-[#C9241E] text-paper cursor-pointer'
                  : done
                    ? 'border-signal bg-signal/10 text-signal cursor-default'
                    : 'border-wire bg-graphite text-dust cursor-not-allowed'
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.35em] opacity-80">
                    {done ? 'publicado' : publishing ? 'transmitindo' : 'ação'}
                  </div>
                  <div className="font-display italic text-3xl font-light mt-1">
                    {done ? 'No ar.' : publishing ? 'Enviando…' : 'Postar agora'}
                  </div>
                </div>
                <div className="font-display text-5xl font-light opacity-70 group-hover:translate-x-1 transition-transform">
                  {done ? '✓' : publishing ? '◐' : '→'}
                </div>
              </div>
              {publishing && (
                <div className="absolute inset-x-0 bottom-0 h-[3px] bg-paper/30 overflow-hidden">
                  <div className="h-full bg-paper animate-[marquee_2s_linear_infinite]" style={{ width: '40%' }} />
                </div>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={async () => {
                  await fetch(`/api/v1/items/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ caption, targets: selected }) })
                  load()
                }}
                className="border border-wire text-dust hover:text-paper hover:border-paper font-mono text-[11px] uppercase tracking-[0.22em] py-3 transition-colors">
                Salvar rascunho
              </button>
              <button onClick={handleReject}
                className="border border-wire text-dust hover:text-onair hover:border-onair font-mono text-[11px] uppercase tracking-[0.22em] py-3 transition-colors">
                Rejeitar
              </button>
            </div>

            {error && <div className="mt-3 font-mono text-[11px] text-onair border border-onair/60 p-2">{error}</div>}
          </div>

          {/* Referencias de produto */}
          {(allProducts.length > 0 || suggested.products.length > 0) && (
            <div className="border border-wire p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust">
                  Refs de produto {suggested.source === 'auto' ? '(sugerido)' : suggested.source === 'manual' ? '(manual)' : suggested.source === 'manual-empty' ? '(desativado)' : ''}
                </div>
                <button
                  onClick={() => setShowProductPicker(v => !v)}
                  className="font-mono text-[9px] uppercase tracking-[0.25em] text-dust hover:text-paper">
                  {showProductPicker ? '× fechar' : '+ editar'}
                </button>
              </div>

              {suggested.products.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {suggested.products.map(p => (
                    <div key={p.slug} className="flex items-center gap-2 border border-wire bg-coal px-2 py-1">
                      <img src={p.primaryImage} alt={p.name} className="w-8 h-8 object-cover" />
                      <span className="font-mono text-[10px] text-paper">{p.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="font-mono text-[10px] text-dust">Nenhum produto referenciado</div>
              )}

              {showProductPicker && (
                <div className="mt-4 border-t border-wire pt-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-dust mb-2">Escolher produtos:</div>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {allProducts.map(p => {
                      const current = m.productSlugs ?? suggested.products.map(x => x.slug)
                      const isSelected = current.includes(p.slug)
                      return (
                        <button
                          key={p.slug}
                          onClick={() => {
                            const base = m.productSlugs ?? suggested.products.map(x => x.slug)
                            const next = isSelected ? base.filter(s => s !== p.slug) : [...base, p.slug]
                            setProductSlugs(next)
                          }}
                          className={`font-mono text-[10px] px-2 py-1 border ${isSelected ? 'border-paper text-paper bg-coal' : 'border-wire text-dust hover:text-paper'}`}>
                          {p.name || p.slug}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setProductSlugs([])}
                    className="font-mono text-[9px] uppercase tracking-[0.25em] text-onair hover:text-paper">
                    desativar referência
                  </button>
                </div>
              )}
            </div>
          )}

          {m.status === 'error' && m.lastError && (
            <div className="border border-onair/60 bg-onair/10 p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-onair mb-2">Falha na geração</div>
              <div className="font-mono text-[11px] text-paper whitespace-pre-wrap break-words">{m.lastError}</div>
            </div>
          )}

          {m.status === 'generating' && (
            <div className="border border-wire bg-coal p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust">Gerando mídia... aguarde alguns minutos</div>
            </div>
          )}

          {/* Media gerada — preview direto */}
          {m.media?.length > 0 && (
            <div className="border border-wire p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-signal mb-3">✓ {m.media.length} mídia(s) gerada(s)</div>
              <div className="grid grid-cols-2 gap-2">
                {m.media.map((mm, i) => (
                  <div key={i} className="border border-wire bg-ink overflow-hidden">
                    {mm.mime?.startsWith('video') ? (
                      <video src={`/media/criados/${mm.path}`} controls className="w-full aspect-[9/16] object-cover" />
                    ) : mm.mime?.startsWith('image') ? (
                      <img src={`/media/criados/${mm.path}`} className="w-full aspect-[4/5] object-cover" />
                    ) : mm.mime?.startsWith('audio') ? (
                      <audio src={`/media/criados/${mm.path}`} controls className="w-full" />
                    ) : null}
                    <div className="px-2 py-1 font-mono text-[9px] text-dust truncate">{mm.role || mm.path}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right: previews */}
        <section className="col-span-12 lg:col-span-8 rise rise-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust">Pré-visualização</div>
              <div className="font-display italic text-2xl text-paper">Como vai aparecer</div>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust">
              ◎ preview ao vivo
            </div>
          </div>

          <div className="border border-wire bg-coal p-8 relative bracketed text-paper">
            <span className="br-tl" /><span className="br-tr" /><span className="br-bl" /><span className="br-br" />

            <div className="flex flex-wrap gap-8 justify-around items-start">
              {(allowed.includes('instagram_feed') || m.type === 'carousel') && (
                <PreviewColumn label="Instagram · Feed" selected={selected.includes('instagram_feed')}>
                  <InstagramFeedPreview m={m} />
                </PreviewColumn>
              )}
              {(allowed.includes('instagram_story') || m.type === 'story') && (
                <PreviewColumn label="Instagram · Story" selected={selected.includes('instagram_story')}>
                  <InstagramStoryPreview m={m} />
                </PreviewColumn>
              )}
              {(allowed.includes('instagram_reel') || allowed.includes('tiktok') || m.type === 'reel') && (
                <PreviewColumn label="TikTok / Reel" selected={selected.includes('tiktok') || selected.includes('instagram_reel')}>
                  <TikTokPreview m={m} />
                </PreviewColumn>
              )}
              {(allowed.includes('linkedin') || m.type === 'carousel') && (
                <PreviewColumn label="LinkedIn" selected={selected.includes('linkedin')}>
                  <LinkedInPreview m={m} />
                </PreviewColumn>
              )}
            </div>
          </div>

          {/* Technical strip */}
          <div className="grid grid-cols-4 gap-6 mt-8 border-t border-wire pt-6 font-mono text-[10px] uppercase tracking-[0.28em]">
            <Meta k="Criado" v={new Date(m.createdAt).toLocaleString('pt-BR')} />
            <Meta k="Autor" v={m.agent} />
            <Meta k="Tipo" v={typeLabel[m.type]} />
            <Meta k="ID" v={m.id.slice(0, 18) + '…'} />
          </div>
        </section>
      </div>
    </div>
  )
}

function PreviewColumn({ label, children, selected }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`font-mono text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 ${selected ? 'text-paper' : 'text-dust'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-onair' : 'bg-wire'}`} />
        {label}
      </div>
      <div className={`transition-all ${selected ? '' : 'opacity-40 saturate-50'}`}>{children}</div>
    </div>
  )
}

function Meta({ k, v }) {
  return (
    <div>
      <div className="text-dust">{k}</div>
      <div className="text-paper mt-1 normal-case tracking-normal">{v}</div>
    </div>
  )
}
