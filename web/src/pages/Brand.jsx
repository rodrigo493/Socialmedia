import { useEffect, useRef, useState } from 'react'

function UsersSection() {
  const [users, setUsers] = useState([])
  const [newU, setNewU] = useState('')
  const [newP, setNewP] = useState('')
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    const r = await (await fetch('/api/v1/auth/users')).json()
    setUsers(Array.isArray(r) ? r : [])
  }
  useEffect(() => { load() }, [])

  async function add(e) {
    e.preventDefault()
    setErr(null); setBusy(true)
    try {
      const res = await fetch('/api/v1/auth/users', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: newU, password: newP }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'erro')
      setNewU(''); setNewP('')
      load()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  async function del(username) {
    if (!confirm(`Apagar usuário ${username}?`)) return
    const res = await fetch(`/api/v1/auth/users/${encodeURIComponent(username)}`, { method: 'DELETE' })
    const d = await res.json()
    if (!res.ok || d.error) alert(d.error || 'erro')
    load()
  }

  return (
    <section className="mb-10 rise rise-1">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-onair">Usuários do painel</div>
          <div className="font-display italic text-2xl text-paper">Quem tem acesso</div>
        </div>
      </div>

      <div className="border border-wire bg-coal p-5">
        <ul className="space-y-2 mb-5">
          {users.map(u => (
            <li key={u.username} className="flex items-center justify-between py-2 border-b border-wire/40">
              <div>
                <span className="font-mono text-paper text-sm">{u.username}</span>
                <span className="font-mono text-[10px] text-dust ml-3">criado em {new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <button onClick={() => del(u.username)} className="font-mono text-[10px] uppercase tracking-widest text-dust border border-wire px-3 py-1 hover:text-onair hover:border-onair">
                apagar
              </button>
            </li>
          ))}
          {users.length === 0 && <li className="font-mono text-[10px] text-wire uppercase tracking-widest">(vazio)</li>}
        </ul>

        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
          <input value={newU} onChange={e => setNewU(e.target.value)} placeholder="novo usuário"
            className="bg-ink border border-wire text-paper p-2 text-sm font-mono focus:outline-none focus:border-paper" />
          <input type="password" value={newP} onChange={e => setNewP(e.target.value)} placeholder="senha (mín 8 chars)"
            className="bg-ink border border-wire text-paper p-2 text-sm font-mono focus:outline-none focus:border-paper" />
          <button type="submit" disabled={busy || !newU || !newP}
            className="font-mono text-[11px] uppercase tracking-widest text-paper bg-onair border border-onair px-4 py-2 disabled:opacity-40 hover:bg-[#C9241E]">
            {busy ? '…' : '+ Criar'}
          </button>
        </form>
        {err && <div className="mt-2 font-mono text-[10px] text-onair">{err}</div>}
        <div className="font-mono text-[10px] text-dust mt-3">
          Apenas usuários logados conseguem criar outros. Setup público só funciona na primeira vez.
        </div>
      </div>
    </section>
  )
}

const TABS = [
  { id: 'company', label: 'Empresa', hint: 'Identificação, missão, visão, tom de voz. Carregado em todos os agentes.' },
  { id: 'preferences', label: 'Preferências', hint: 'Regras operacionais, padrões editoriais, o que evitar.' },
]

export default function Brand() {
  const [tab, setTab] = useState('company')
  const [logo, setLogo] = useState({ hasLogo: false, file: null })
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  async function loadLogo() {
    const r = await (await fetch('/api/v1/brand/logo')).json()
    setLogo(r)
    window.dispatchEvent(new Event('brand:logo-updated'))
  }
  useEffect(() => { loadLogo() }, [])

  async function uploadLogo(files) {
    if (!files || !files[0]) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', files[0])
      await fetch('/api/v1/brand/logo', { method: 'POST', body: form })
      await loadLogo()
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  async function removeLogo() {
    await fetch('/api/v1/brand/logo', { method: 'DELETE' })
    loadLogo()
  }

  const [manualFiles, setManualFiles] = useState([])
  const [uploadingManual, setUploadingManual] = useState(false)
  const manualRef = useRef(null)

  async function loadManual() {
    const r = await (await fetch('/api/v1/brand/manual')).json()
    setManualFiles(Array.isArray(r) ? r : [])
  }
  useEffect(() => { loadManual() }, [])

  async function uploadManual(files) {
    if (!files || files.length === 0) return
    setUploadingManual(true)
    try {
      const form = new FormData()
      for (const f of files) form.append('file', f)
      await fetch('/api/v1/brand/manual', { method: 'POST', body: form })
      await loadManual()
    } finally { setUploadingManual(false); if (manualRef.current) manualRef.current.value = '' }
  }

  async function deleteManual(name) {
    if (!confirm(`Apagar ${name}?`)) return
    await fetch(`/api/v1/brand/manual/${encodeURIComponent(name)}`, { method: 'DELETE' })
    loadManual()
  }

  function fmtBytes(b) {
    if (b < 1024) return b + ' B'
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
    return (b / 1024 / 1024).toFixed(1) + ' MB'
  }
  function iconFor(file) {
    const ext = file.split('.').pop().toLowerCase()
    if (ext === 'pdf') return '📄'
    if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) return '🖼️'
    if (['doc', 'docx'].includes(ext)) return '📝'
    return '📦'
  }
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function load() {
    setLoading(true); setSaved(false)
    try {
      const r = await (await fetch(`/api/v1/brand/${tab}`)).json()
      setContent(r.content || '')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [tab])

  async function save() {
    setSaving(true); setSaved(false)
    try {
      await fetch(`/api/v1/brand/${tab}`, {
        method: 'PUT', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally { setSaving(false) }
  }

  const current = TABS.find(t => t.id === tab)

  return (
    <div>
      <section className="pb-8 mb-8 border-b border-wire">
        <div className="flex items-end justify-between gap-8">
          <div className="rise">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-onair mb-4">Memória da Marca</div>
            <h1 className="font-display text-[72px] leading-[0.92] font-light tracking-[-0.02em] text-paper">
              DNA<span className="text-onair">.</span>
            </h1>
            <p className="font-display text-xl italic text-dust max-w-xl mt-5">
              O que todos os agentes leem antes de responder. Mude o tom da marca aqui e o chat inteiro muda junto.
            </p>
          </div>

          {/* Logo box */}
          <div className="rise rise-1 w-64">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust mb-2">Logo (cabeçalho + export)</div>
            <div className="border border-wire bg-coal p-4 flex flex-col items-center gap-3">
              <div className="w-full h-24 flex items-center justify-center bg-ink border border-wire/60">
                {logo.hasLogo ? (
                  <img src={`/api/v1/brand/logo/image?t=${Date.now()}`} alt="Logo" className="max-h-20 max-w-full object-contain" />
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-dust">sem logo</span>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={e => uploadLogo(e.target.files)} />
              <div className="flex gap-2 w-full">
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="flex-1 font-mono text-[10px] uppercase tracking-widest text-paper bg-onair border border-onair px-3 py-2 hover:bg-[#C9241E] disabled:opacity-40">
                  {uploading ? '…' : logo.hasLogo ? 'Trocar' : '+ Upload'}
                </button>
                {logo.hasLogo && (
                  <button onClick={removeLogo}
                    className="font-mono text-[10px] uppercase tracking-widest text-dust border border-wire px-3 py-2 hover:text-onair hover:border-onair">
                    ×
                  </button>
                )}
              </div>
              <div className="font-mono text-[9px] text-dust text-center">PNG/JPG/SVG/WebP · recomendado PNG transparente</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 rise rise-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`font-mono text-[11px] uppercase tracking-[0.22em] px-4 py-2 border transition-colors
              ${tab === t.id ? 'border-paper text-paper bg-paper/5' : 'border-wire text-dust hover:text-paper'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust mb-3">{current?.hint}</p>

      {/* Usuários do painel */}
      <UsersSection />

      {/* Manual da marca */}
      <section className="mb-10 rise rise-1">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-onair">Manual da Marca</div>
            <div className="font-display italic text-2xl text-paper">Guidelines · assets institucionais</div>
          </div>
          <input ref={manualRef} type="file" multiple className="hidden" onChange={e => uploadManual(e.target.files)} />
          <button onClick={() => manualRef.current?.click()} disabled={uploadingManual}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper bg-onair border border-onair px-4 py-2 hover:bg-[#C9241E] disabled:opacity-40">
            {uploadingManual ? 'enviando…' : '+ upload (PDF, imagens, qualquer)'}
          </button>
        </div>

        {manualFiles.length === 0 ? (
          <div className="border border-dashed border-wire p-10 text-center">
            <div className="font-display italic text-xl text-dust">Sem arquivos ainda.</div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-wire mt-2">Suba o manual da marca, brand book, guidelines de tom, paleta, tipografia…</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {manualFiles.map(f => (
              <div key={f.file} className="border border-wire bg-coal p-4 flex items-center gap-4">
                <div className="text-3xl">{iconFor(f.file)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-sm text-paper truncate" title={f.file}>{f.file}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-dust mt-1">{fmtBytes(f.size)} · {new Date(f.modified).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <a href={`/api/v1/brand/manual/${encodeURIComponent(f.file)}`} target="_blank" rel="noreferrer"
                    className="font-mono text-[10px] uppercase tracking-widest text-paper border border-wire px-2 py-1 hover:border-paper">abrir</a>
                  <button onClick={() => deleteManual(f.file)}
                    className="font-mono text-[10px] uppercase tracking-widest text-dust border border-wire px-2 py-1 hover:text-onair hover:border-onair">×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <div className="py-20 text-center font-display italic text-2xl text-dust">carregando…</div>
      ) : (
        <>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={26}
            className="w-full bg-coal border border-wire text-paper font-mono text-[13px] leading-relaxed p-5 focus:outline-none focus:border-paper resize-y"
          />
          <div className="mt-4 flex items-center gap-3">
            <button onClick={save} disabled={saving}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper bg-onair border border-onair px-5 py-2.5 hover:bg-[#C9241E] disabled:opacity-40">
              {saving ? 'salvando…' : 'Salvar'}
            </button>
            <button onClick={load} className="font-mono text-[11px] uppercase tracking-[0.22em] text-dust border border-wire px-5 py-2.5 hover:text-paper hover:border-paper">
              descartar alterações
            </button>
            {saved && <span className="font-mono text-[10px] uppercase tracking-widest text-signal">✓ salvo · afeta todas as respostas daqui em diante</span>}
          </div>
        </>
      )}
    </div>
  )
}
