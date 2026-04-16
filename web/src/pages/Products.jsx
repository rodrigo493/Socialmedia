import { useEffect, useState, useRef } from 'react'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [creating, setCreating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  async function importDrive() {
    if (!confirm('Importar subpastas/imagens do Google Drive como produtos?')) return
    setSyncing(true); setSyncResult(null)
    try {
      const r = await fetch('/api/v1/products/sync-drive', { method: 'POST' })
      const data = await r.json()
      setSyncResult(data)
      if (data.ok) await load()
    } catch (e) {
      setSyncResult({ ok: false, error: String(e.message || e) })
    } finally { setSyncing(false) }
  }

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/products')
      setProducts(await res.json())
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  if (selected) return <ProductDetail slug={selected} onBack={() => { setSelected(null); load() }} />

  return (
    <div>
      <section className="pb-10 mb-10 border-b border-wire">
        <div className="flex items-end justify-between gap-8">
          <div className="rise">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-onair mb-5">Catálogo · Equipamentos Live</div>
            <h1 className="font-display text-[80px] leading-[0.92] font-light tracking-[-0.02em] text-paper">
              Produtos<span className="text-onair">.</span>
            </h1>
            <p className="font-display text-xl italic text-dust max-w-xl mt-5">
              Referências visuais dos equipamentos que alimentam as cenas das influencers IA.
            </p>
          </div>
          <div className="rise rise-1 flex items-end gap-6">
            <div className="text-right">
              <div className="font-display text-6xl font-light text-paper leading-none">{String(products.length).padStart(2,'0')}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust mt-2">no catálogo</div>
            </div>
            <button
              onClick={importDrive}
              disabled={syncing}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-dust border border-wire hover:text-paper hover:border-paper px-4 py-3 disabled:opacity-40"
            >{syncing ? 'Importando…' : '↓ Importar do Drive'}</button>
            <button
              onClick={() => setCreating(true)}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper bg-onair border border-onair px-4 py-3 hover:bg-[#C9241E]"
            >+ Novo produto</button>
          </div>
        </div>
      </section>

      {syncResult && (
        <div className={`mb-6 border p-4 ${syncResult.ok ? 'border-signal/60 bg-signal/10' : 'border-onair/60 bg-onair/10'}`}>
          {syncResult.ok ? (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-signal mb-2">
                ✓ Sync concluído — {syncResult.products?.length || 0} produto(s), {syncResult.totalDownloaded} baixado(s), {syncResult.totalSkipped} já em dia
              </div>
              <div className="font-mono text-[10px] text-dust">
                {(syncResult.products || []).map(p => `${p.name} (${p.downloaded}+${p.skipped})`).join(' · ')}
              </div>
            </div>
          ) : (
            <div className="font-mono text-[11px] text-onair">Erro: {syncResult.error}</div>
          )}
        </div>
      )}

      {creating && <NewProductForm onDone={(slug) => { setCreating(false); setSelected(slug); }} onCancel={() => setCreating(false)} />}

      {loading && <div className="py-20 text-center font-display italic text-2xl text-dust">Carregando…</div>}

      {!loading && products.length === 0 && !creating && (
        <div className="py-24 text-center">
          <div className="font-display italic text-3xl text-dust">Nenhum produto cadastrado.</div>
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-wire mt-3">Clique em "Novo produto" para começar.</div>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p, i) => (
            <button key={p.slug}
              onClick={() => setSelected(p.slug)}
              className={`rise rise-${Math.min(i+1, 5)} group text-left border border-wire hover:border-paper bg-coal transition-colors`}
            >
              <div className="aspect-[4/3] bg-ink overflow-hidden relative">
                {p.images?.frontal ? (
                  <img src={`/products-media/${p.slug}/${p.images.frontal}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-dust">sem imagem</div>
                )}
                {p.incomplete && (
                  <div className="absolute top-2 right-2 font-mono text-[10px] uppercase tracking-widest bg-amber text-ink px-2 py-1">catalog pendente</div>
                )}
              </div>
              <div className="p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-dust">{p.category || '—'}</div>
                <div className="font-display italic text-xl text-paper mt-1 leading-tight">{p.name || p.slug}</div>
                {p.differential && <div className="font-sans text-xs text-dust mt-2 line-clamp-2">{p.differential}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function NewProductForm({ onDone, onCancel }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Pilates Studio')
  const [busy, setBusy] = useState(false)

  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

  async function submit() {
    if (!slug) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/products/${slug}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, category, description: '', differential: '', icp: '', images: {}, tags: [] }),
      })
      if (res.ok) onDone(slug)
    } finally { setBusy(false) }
  }

  return (
    <div className="mb-10 border border-wire bg-coal p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-onair mb-4">Novo produto</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust">Nome</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Reformer V12"
            className="w-full mt-1 bg-ink border border-wire text-paper p-2 focus:outline-none focus:border-paper font-sans" />
          <div className="font-mono text-[10px] text-dust mt-1">slug: {slug || '—'}</div>
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust">Categoria</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full mt-1 bg-ink border border-wire text-paper p-2 focus:outline-none focus:border-paper font-sans">
            <option>Pilates Studio</option>
            <option>Pilates Home</option>
            <option>Funcional</option>
            <option>Cardio</option>
            <option>Reabilitação</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button onClick={submit} disabled={!slug || busy}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper bg-onair border border-onair px-4 py-2 disabled:opacity-40">
            {busy ? 'criando…' : 'Criar →'}
          </button>
          <button onClick={onCancel} className="font-mono text-[11px] uppercase tracking-[0.22em] text-dust border border-wire px-4 py-2 hover:text-paper hover:border-paper">cancelar</button>
        </div>
      </div>
    </div>
  )
}

function ProductDetail({ slug, onBack }) {
  const [detail, setDetail] = useState(null)
  const [editing, setEditing] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const dropRef = useRef(null)
  const fileRef = useRef(null)

  async function load() {
    const res = await fetch(`/api/v1/products/${slug}`)
    const data = await res.json()
    setDetail(data)
    setEditing(data.catalog || { slug, name: slug, category: '', description: '', differential: '', icp: '', images: {}, tags: [] })
  }
  useEffect(() => { load() }, [slug])

  async function upload(files) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('target', 'products')
      form.append('slug', slug)
      for (const f of files) form.append('file', f)
      const res = await fetch('/api/v1/uploads', { method: 'POST', body: form })
      if (res.ok) await load()
    } finally { setUploading(false) }
  }

  async function save() {
    setSaving(true)
    try {
      await fetch(`/api/v1/products/${slug}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(editing),
      })
      await load()
    } finally { setSaving(false) }
  }

  if (!detail) return <div className="py-20 text-center font-display italic text-2xl text-dust">Carregando…</div>

  const imageFiles = detail.files.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))

  return (
    <div>
      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-dust mb-8">
        <button onClick={onBack} className="hover:text-paper">← Produtos</button>
        <span className="text-wire">/</span>
        <span className="text-paper">{detail.catalog?.name || slug}</span>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left: metadata */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-onair mb-3">Metadata</div>
            <h1 className="font-display italic text-4xl font-light text-paper leading-tight">{editing?.name}</h1>
          </div>

          <Field label="Nome" value={editing?.name} onChange={v => setEditing({ ...editing, name: v })} />
          <Field label="Categoria" value={editing?.category} onChange={v => setEditing({ ...editing, category: v })} />
          <Field label="Diferencial técnico" value={editing?.differential} onChange={v => setEditing({ ...editing, differential: v })} multiline />
          <Field label="ICP (quem usa)" value={editing?.icp} onChange={v => setEditing({ ...editing, icp: v })} />
          <Field label="Descrição" value={editing?.description} onChange={v => setEditing({ ...editing, description: v })} multiline />

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust mb-2">Mapeamento de imagens</div>
            <div className="space-y-2">
              {['frontal', 'perspectiva', 'close', 'ambiente', 'uso'].map(role => (
                <div key={role} className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-dust w-24">{role}</span>
                  <select
                    value={editing?.images?.[role] || ''}
                    onChange={e => setEditing({ ...editing, images: { ...editing.images, [role]: e.target.value } })}
                    className="flex-1 bg-ink border border-wire text-paper p-1.5 text-xs font-mono focus:outline-none focus:border-paper"
                  >
                    <option value="">—</option>
                    {imageFiles.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <button onClick={save} disabled={saving}
            className="w-full font-mono text-[11px] uppercase tracking-[0.22em] text-paper bg-onair border border-onair py-3 disabled:opacity-40 hover:bg-[#C9241E]">
            {saving ? 'salvando…' : 'Salvar catálogo'}
          </button>
        </aside>

        {/* Right: images */}
        <section className="col-span-12 lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust">Imagens</div>
              <div className="font-display italic text-2xl text-paper">{imageFiles.length} arquivo(s)</div>
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e => upload(e.target.files)} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper border border-paper px-4 py-2 hover:bg-paper hover:text-ink disabled:opacity-40">
              {uploading ? 'enviando…' : '+ upload imagens'}
            </button>
          </div>

          <div
            ref={dropRef}
            onDragOver={e => { e.preventDefault(); dropRef.current.classList.add('border-onair') }}
            onDragLeave={() => dropRef.current.classList.remove('border-onair')}
            onDrop={e => { e.preventDefault(); dropRef.current.classList.remove('border-onair'); upload(e.dataTransfer.files) }}
            className="border border-dashed border-wire p-3 transition-colors"
          >
            {imageFiles.length === 0 ? (
              <div className="py-20 text-center font-display italic text-xl text-dust">
                Arraste fotos do produto aqui ou clique em "+ upload imagens"
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {imageFiles.map(f => (
                  <div key={f} className="border border-wire bg-ink overflow-hidden">
                    <div className="aspect-[4/3]">
                      <img src={`/products-media/${slug}/${f}`} alt={f} className="w-full h-full object-cover" />
                    </div>
                    <div className="px-2 py-1.5 font-mono text-[10px] text-dust truncate">{f}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, multiline }) {
  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-1">{label}</label>
      {multiline ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={2}
          className="w-full bg-ink border border-wire text-paper p-2 text-sm font-sans focus:outline-none focus:border-paper resize-none" />
      ) : (
        <input value={value || ''} onChange={e => onChange(e.target.value)}
          className="w-full bg-ink border border-wire text-paper p-2 text-sm font-sans focus:outline-none focus:border-paper" />
      )}
    </div>
  )
}
