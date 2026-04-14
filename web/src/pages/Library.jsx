import { useEffect, useState, useRef } from 'react'

const ICON = {
  folder: '📁',
  image: '🖼️', video: '🎬', audio: '🎧',
  pdf: '📄', doc: '📝', sheet: '📊', slide: '📽️',
  default: '📦',
}
function iconFor(mime) {
  if (!mime) return ICON.default
  if (mime === 'application/vnd.google-apps.folder') return ICON.folder
  if (mime.startsWith('image/')) return ICON.image
  if (mime.startsWith('video/')) return ICON.video
  if (mime.startsWith('audio/')) return ICON.audio
  if (mime.includes('pdf')) return ICON.pdf
  if (mime.includes('document')) return ICON.doc
  if (mime.includes('spreadsheet')) return ICON.sheet
  if (mime.includes('presentation')) return ICON.slide
  return ICON.default
}

export default function Library() {
  const [status, setStatus] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [stack, setStack] = useState([{ id: null, name: 'Raiz' }])
  const [query, setQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const current = stack[stack.length - 1]

  async function load() {
    setLoading(true)
    try {
      const st = await (await fetch('/api/v1/drive/status')).json()
      setStatus(st)
      if (!st.configured) { setFiles([]); return }
      const url = query
        ? `/api/v1/drive/search?q=${encodeURIComponent(query)}`
        : `/api/v1/drive/list${current.id ? `?folderId=${current.id}` : ''}`
      const data = await (await fetch(url)).json()
      setFiles(Array.isArray(data) ? data : [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [current.id, query])

  async function upload(fileList) {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    try {
      const form = new FormData()
      if (current.id) form.append('parentId', current.id)
      for (const f of fileList) form.append('file', f)
      await fetch('/api/v1/drive/upload', { method: 'POST', body: form })
      await load()
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  async function newFolder() {
    const name = prompt('Nome da pasta:')
    if (!name) return
    await fetch('/api/v1/drive/folder', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, parentId: current.id }),
    })
    load()
  }

  return (
    <div>
      <section className="pb-10 mb-10 border-b border-wire">
        <div className="flex items-end justify-between gap-8">
          <div className="rise">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-onair mb-5">Biblioteca · Google Drive</div>
            <h1 className="font-display text-[80px] leading-[0.92] font-light tracking-[-0.02em] text-paper">
              Acervo<span className="text-onair">.</span>
            </h1>
            <p className="font-display text-xl italic text-dust max-w-xl mt-5">
              Todo o material de marketing vive aqui. Os agentes têm acesso.
            </p>
          </div>
        </div>
      </section>

      {status && !status.configured && <SetupGuide status={status} />}

      {status?.configured && (
        <>
          {/* Breadcrumbs + actions */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-dust flex-1 min-w-0">
              {stack.map((s, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <span className="text-wire">/</span>}
                  <button
                    onClick={() => setStack(stack.slice(0, i + 1))}
                    className={i === stack.length - 1 ? 'text-paper' : 'hover:text-paper'}
                  >{s.name}</button>
                </span>
              ))}
            </div>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="buscar…"
              className="bg-ink border border-wire text-paper px-3 py-2 font-sans text-sm focus:outline-none focus:border-paper w-64"
            />
            <input ref={fileRef} type="file" multiple className="hidden" onChange={e => upload(e.target.files)} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper bg-onair border border-onair px-4 py-2 hover:bg-[#C9241E] disabled:opacity-40">
              {uploading ? 'enviando…' : '+ upload'}
            </button>
            <button onClick={newFolder} className="font-mono text-[11px] uppercase tracking-[0.22em] text-dust border border-wire px-4 py-2 hover:text-paper hover:border-paper">
              + pasta
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center font-display italic text-2xl text-dust">Carregando…</div>
          ) : files.length === 0 ? (
            <div className="py-24 text-center">
              <div className="font-display italic text-3xl text-dust">{query ? 'Nada encontrado.' : 'Pasta vazia.'}</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {files.map(f => (
                <FileCard key={f.id} f={f} onOpenFolder={() => setStack([...stack, { id: f.id, name: f.name }])} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function FileCard({ f, onOpenFolder }) {
  const isFolder = f.mimeType === 'application/vnd.google-apps.folder'
  const isImage = f.mimeType?.startsWith('image/')
  const isVideo = f.mimeType?.startsWith('video/')

  if (isFolder) {
    return (
      <button onClick={onOpenFolder}
        className="aspect-square border border-wire bg-coal hover:border-paper transition-colors p-4 flex flex-col justify-between text-left">
        <div className="text-4xl">📁</div>
        <div className="font-sans text-sm text-paper line-clamp-2">{f.name}</div>
      </button>
    )
  }

  return (
    <a href={f.webViewLink} target="_blank" rel="noreferrer"
       className="aspect-square border border-wire bg-coal hover:border-paper transition-colors overflow-hidden flex flex-col group">
      <div className="flex-1 relative bg-ink flex items-center justify-center overflow-hidden">
        {isImage || isVideo ? (
          <img src={`/api/v1/drive/file/${f.id}`} alt={f.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">{iconFor(f.mimeType)}</span>
        )}
      </div>
      <div className="p-2 border-t border-wire">
        <div className="font-sans text-[11px] text-paper line-clamp-1">{f.name}</div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-dust mt-0.5 truncate">
          {f.mimeType?.split('/').pop() || '—'}
        </div>
      </div>
    </a>
  )
}

function SetupGuide({ status }) {
  return (
    <div className="border border-amber/40 bg-amber/5 p-8 rounded-sm">
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber mb-3">Setup necessário · 5 min</div>
      <h3 className="font-display italic text-2xl text-paper mb-5">Conectar Google Drive</h3>

      <ol className="space-y-4 text-bone text-sm leading-relaxed list-decimal list-inside">
        <li>Vá em <a className="text-onair hover:underline" href="https://console.cloud.google.com" target="_blank" rel="noreferrer">console.cloud.google.com</a> e crie um projeto (ou use o que você já tem da chave do Gemini)</li>
        <li>No projeto, habilite a <strong>Google Drive API</strong> em "APIs &amp; Services → Library"</li>
        <li>Vá em "IAM &amp; Admin → Service Accounts" → <strong>+ Create Service Account</strong> · nome: <code className="font-mono text-xs bg-coal px-1">liveuniverse-drive</code></li>
        <li>Depois de criada, abra a conta de serviço → aba <strong>Keys</strong> → <strong>Add Key → JSON</strong>. Baixa o arquivo</li>
        <li>Renomeia para <code className="font-mono text-xs bg-coal px-1">gcp-service-account.json</code> e coloca em <code className="font-mono text-xs bg-coal px-1">apps/api/</code></li>
        <li>No Google Drive, cria pasta <strong>"Live Marketing"</strong> e <strong>compartilha com o e-mail da conta de serviço</strong> (o <code className="font-mono text-xs bg-coal px-1">client_email</code> do JSON) com permissão de <strong>Editor</strong></li>
        <li>Copia o <strong>ID da pasta</strong> da URL (ex: <code className="font-mono text-xs bg-coal px-1">drive.google.com/drive/folders/<span className="text-onair">1abc...XYZ</span></code>)</li>
        <li>Adiciona no <code className="font-mono text-xs bg-coal px-1">apps/api/.env</code>:
          <pre className="mt-2 font-mono text-xs bg-coal p-3 border border-wire overflow-auto">{`GOOGLE_SERVICE_ACCOUNT_JSON=./gcp-service-account.json
GOOGLE_DRIVE_FOLDER_ID=1abc...XYZ`}</pre>
        </li>
        <li>Reinicia <code className="font-mono text-xs bg-coal px-1">apps/api</code> e recarrega essa página</li>
      </ol>

      {status.serviceAccountEmail && (
        <div className="mt-6 p-4 border border-signal bg-signal/10 font-mono text-xs">
          <div className="text-signal uppercase tracking-widest mb-2">Arquivo detectado ✓</div>
          <div className="text-paper">Compartilhe a pasta com: <strong>{status.serviceAccountEmail}</strong></div>
        </div>
      )}
    </div>
  )
}
