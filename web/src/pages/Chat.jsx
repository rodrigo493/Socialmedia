import { useEffect, useRef, useState } from 'react'
import { useSpeech } from '../hooks/useSpeech'

const iconFor = {
  'caio-carrossel': '🃏', 'davi-destaque': '🎬', 'elisa-efemera': '✨',
  'giovana-gancho': '🪝', 'henrique-horizonte': '🗺️', 'fabio-funil': '🔻',
  'amanda-anuncio': '📢', 'iris-influencer': '🎭', 'bruno-balizador': '🛡️', 'paula-postagem': '📤',
}

const INITIAL_SYSTEM = { role: 'system', text: 'Todos os agentes estão ouvindo. Pergunte — quem tiver especialidade responde.' }

export default function Chat() {
  const [agents, setAgents] = useState([])
  const [sessions, setSessions] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([INITIAL_SYSTEM])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [lastDraft, setLastDraft] = useState(null)
  const [createdToast, setCreatedToast] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const scrollerRef = useRef(null)

  async function loadSessions() {
    try {
      const r = await (await fetch('/api/v1/chat/sessions')).json()
      setSessions(Array.isArray(r) ? r : [])
    } catch {}
  }

  async function openSession(id) {
    try {
      const s = await (await fetch(`/api/v1/chat/sessions/${id}`)).json()
      if (s.messages) {
        setMessages([INITIAL_SYSTEM, ...s.messages])
        setSessionId(id)
        setLastDraft(null)
      }
    } catch {}
  }

  function newSession() {
    setMessages([INITIAL_SYSTEM])
    setSessionId(null)
    setLastDraft(null)
    setInput('')
  }

  async function deleteSession(id, e) {
    e.stopPropagation()
    if (!confirm('Apagar essa conversa?')) return
    await fetch(`/api/v1/chat/sessions/${id}`, { method: 'DELETE' })
    if (id === sessionId) newSession()
    loadSessions()
  }

  useEffect(() => {
    fetch('/api/v1/agents').then(r => r.json()).then(setAgents).catch(() => {})
    loadSessions()
  }, [])
  useEffect(() => { scrollerRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' }) }, [messages, sending])

  const speech = useSpeech({
    onFinal: (text) => setInput(prev => (prev ? prev + ' ' : '') + text),
  })

  async function upload(files) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('target', 'chat')
      for (const f of files) form.append('file', f)
      const res = await fetch('/api/v1/uploads', { method: 'POST', body: form })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'erro upload')
      setAttachments(a => [...a, ...body.uploaded])
    } catch (err) {
      setMessages(m => [...m, { role: 'system', text: 'Erro upload: ' + err.message }])
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function send() {
    const text = input.trim()
    if ((!text && attachments.length === 0) || sending) return
    setInput('')
    const msgText = attachments.length > 0
      ? `${text}\n\n[anexos: ${attachments.map(a => a.saved).join(', ')}]`
      : text
    const next = [...messages, { role: 'user', text: msgText, at: new Date().toISOString(), attachments }]
    setMessages(next)
    setAttachments([])
    setSending(true)
    try {
      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: msgText,
          attachments: next[next.length - 1].attachments,
          history: next.filter(m => m.role !== 'system').slice(-10),
          sessionId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'erro')
      setMessages(m => [...m, { role: 'agent', agent: data.agent, supporters: data.supporters, text: data.text, draft: data.draft, at: data.at }])
      if (data.draft) setLastDraft({ agent: data.agent.id, draft: data.draft })
      if (data.sessionId && data.sessionId !== sessionId) setSessionId(data.sessionId)
      loadSessions()
    } catch (err) {
      setMessages(m => [...m, { role: 'system', text: 'Erro: ' + err.message }])
    } finally {
      setSending(false)
    }
  }

  async function createDraft() {
    if (!lastDraft) return
    const body = { ...lastDraft.draft, agent: lastDraft.agent, autoGenerate: true }
    const res = await fetch('/api/v1/items', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    })
    const item = await res.json()
    if (res.ok) {
      setCreatedToast(item)
      setLastDraft(null)
      setTimeout(() => setCreatedToast(null), 10000)
    }
  }

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Header */}
      <section className="col-span-12 pb-6 border-b border-wire">
        <div className="flex items-end justify-between gap-8">
          <div className="rise">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-onair mb-5">Mesa Redonda · 10 Agentes</div>
            <h1 className="font-display text-[72px] leading-[0.92] font-light tracking-[-0.02em] text-paper">
              Escuta <span className="italic">ativa</span><span className="text-onair">.</span>
            </h1>
          </div>
          <div className="rise rise-1 text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust mb-2">Online</div>
            <div className="flex flex-wrap gap-1.5 justify-end max-w-md">
              {agents.map(a => (
                <span key={a.id} title={`${a.id} · ${a.role}`} className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest border border-wire px-2 py-1 text-dust">
                  <span className="text-base leading-none">{a.icon}</span>{a.id.split('-')[0]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sidebar · sessões */}
      <aside className="col-span-12 lg:col-span-3 rise rise-2">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust">Conversas</div>
          <button onClick={newSession} title="Nova conversa"
            className="font-mono text-[10px] uppercase tracking-widest text-paper bg-onair border border-onair px-2 py-1 hover:bg-[#C9241E]">
            + nova
          </button>
        </div>

        <div className="max-h-[600px] overflow-y-auto space-y-1">
          {sessions.length === 0 && (
            <div className="font-mono text-[10px] uppercase tracking-widest text-wire py-4 text-center">sem conversas</div>
          )}
          {sessions.map(s => (
            <div key={s.id} onClick={() => openSession(s.id)}
              className={`group cursor-pointer px-3 py-2 border text-sm transition-colors
                ${sessionId === s.id ? 'border-paper bg-paper/5' : 'border-wire hover:border-paper/40'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-paper font-sans line-clamp-2 text-[13px] leading-snug">{s.title}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-dust mt-1">
                    {s.messageCount / 2 | 0} trocas · {s.lastAgent ? s.lastAgent.split('-')[0] : '—'}
                  </div>
                  <div className="font-mono text-[9px] text-wire">
                    {new Date(s.updatedAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-dust hover:text-onair text-xs">✕</button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Conversation */}
      <section className="col-span-12 lg:col-span-9 rise rise-2">
        <div ref={scrollerRef} className="bg-coal border border-wire p-6 h-[620px] overflow-y-auto space-y-5">
          {messages.map((m, i) => <Bubble key={i} m={m} />)}
          {sending && <TypingBubble />}
        </div>

        {/* Draft pill */}
        {lastDraft && (
          <div className="mt-4 flex items-center justify-between gap-4 border border-onair/60 bg-onair/10 p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{iconFor[lastDraft.agent] || '✨'}</span>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-onair">Draft sugerido · {lastDraft.draft.type}</div>
                <div className="font-display italic text-xl text-paper">{lastDraft.draft.title}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setLastDraft(null)} className="font-mono text-[11px] uppercase tracking-[0.22em] text-dust border border-wire px-4 py-2 hover:text-paper hover:border-paper">descartar</button>
              <button onClick={createDraft} className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper bg-onair border border-onair px-4 py-2 hover:bg-[#C9241E]">Produzir agora → Criados</button>
            </div>
          </div>
        )}

        {createdToast && (
          <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-signal border border-signal/60 p-3">
            ✓ Produzindo em segundo plano: <span className="text-paper normal-case tracking-normal">{createdToast.title}</span>
            {' · '}
            <a href="/criados" className="text-onair hover:text-paper">acompanhar em /criados →</a>
          </div>
        )}

        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((a, i) => (
              <div key={i} className="flex items-center gap-2 border border-wire bg-coal px-2 py-1 text-xs font-mono text-paper">
                📎 {a.saved}
                <button
                  onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}
                  className="text-dust hover:text-onair"
                >×</button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="mt-4 flex items-end gap-3 border border-wire bg-coal p-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={speech.listening ? 'Ouvindo…' : 'Pergunte, peça ideia, descreva o que quer criar. Shift+Enter para quebra de linha.'}
            rows={2}
            className="flex-1 bg-transparent text-paper font-sans text-[15px] placeholder:text-dust focus:outline-none resize-none"
          />
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={e => upload(e.target.files)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Anexar imagem ou vídeo"
            className={`w-12 h-12 flex items-center justify-center border transition-all
              ${uploading ? 'border-amber text-amber' : 'border-wire text-dust hover:text-paper hover:border-paper'}`}
          >
            {uploading ? '◐' : <AttachIcon />}
          </button>
          <button
            onClick={speech.listening ? speech.stop : speech.start}
            disabled={!speech.supported}
            title={speech.supported ? 'Ditar por voz' : 'Voz não suportada no seu navegador'}
            className={`w-12 h-12 flex items-center justify-center border transition-all
              ${speech.listening ? 'border-onair bg-onair text-paper onair-dot' : 'border-wire text-dust hover:text-paper hover:border-paper'}
              ${!speech.supported ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <MicIcon />
          </button>
          <button
            onClick={send}
            disabled={(!input.trim() && attachments.length === 0) || sending}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper bg-onair border border-onair px-5 h-12 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#C9241E]"
          >
            {sending ? 'enviando…' : 'enviar →'}
          </button>
        </div>
        {!speech.supported && (
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust mt-2">
            Entrada por voz exige Chrome/Edge. Use Firefox só para texto.
          </div>
        )}
      </section>
    </div>
  )
}

function Bubble({ m }) {
  if (m.role === 'system') {
    return <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust text-center py-2">{m.text}</div>
  }
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] bg-paper text-ink px-4 py-3 font-sans text-[14px] leading-snug">
          <div className="whitespace-pre-wrap">{m.text}</div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-ink/60 mt-1.5">Você</div>
        </div>
      </div>
    )
  }
  // agent
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-graphite border border-wire flex items-center justify-center text-lg flex-shrink-0">
        {m.agent?.icon || '🤖'}
      </div>
      <div className="max-w-[78%]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-display italic text-paper text-lg leading-none">{m.agent?.id}</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-dust">{m.agent?.role}</span>
          {m.supporters?.length > 0 && (
            <span className="font-mono text-[9px] uppercase tracking-widest text-wire">
              · também acompanhando: {m.supporters.map(s => s.id.split('-')[0]).join(', ')}
            </span>
          )}
        </div>
        <div className="bg-graphite border-l-2 border-onair px-4 py-3 font-sans text-[14px] leading-relaxed text-bone whitespace-pre-wrap">
          {m.text}
        </div>
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-graphite border border-wire flex items-center justify-center text-lg flex-shrink-0">◐</div>
      <div className="bg-graphite border-l-2 border-onair px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-dust">
        agentes analisando…
      </div>
    </div>
  )
}

function AttachIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
    </svg>
  )
}
