import { useState, useEffect, useRef } from 'react'
import { getToken } from '../lib/auth'

const api = (path, opts = {}) =>
  fetch(path, { headers: { authorization: `Bearer ${getToken()}`, 'content-type': 'application/json', ...(opts.headers || {}) }, ...opts })

// ─── Sub-componentes ───────────────────────────────────────────────────────

function TagList({ label, items, onAdd, onRemove, placeholder }) {
  const [val, setVal] = useState('')

  function add() {
    const v = val.trim()
    if (!v || items.includes(v)) return
    onAdd(v)
    setVal('')
  }

  return (
    <div className="mb-6">
      <label className="block font-mono text-[11px] uppercase tracking-[0.2em] text-dust mb-2">{label}</label>
      <div className="flex gap-2 mb-3">
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={placeholder}
          className="flex-1 bg-coal border border-wire font-mono text-[13px] text-paper px-3 py-2 focus:outline-none focus:border-onair placeholder:text-dust/40"
        />
        <button
          onClick={add}
          className="font-mono text-[11px] uppercase tracking-[0.2em] border border-wire text-dust px-4 py-2 hover:border-onair hover:text-onair transition-colors"
        >
          + Adicionar
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <span key={item} className="flex items-center gap-2 font-mono text-[12px] bg-coal border border-wire text-paper px-3 py-1">
            {item}
            <button onClick={() => onRemove(item)} className="text-dust hover:text-red-400 transition-colors leading-none">×</button>
          </span>
        ))}
        {items.length === 0 && <span className="font-mono text-[11px] text-dust/40 italic">Nenhum adicionado ainda</span>}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    idle:    { label: 'AGUARDANDO', cls: 'text-dust border-wire' },
    running: { label: 'EXECUTANDO', cls: 'text-onair border-onair animate-pulse' },
    done:    { label: 'CONCLUÍDO',  cls: 'text-green-400 border-green-500' },
    error:   { label: 'ERRO',       cls: 'text-red-400 border-red-500' },
  }
  const { label, cls } = map[status] || map.idle
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.25em] border px-2 py-1 ${cls}`}>
      {label}
    </span>
  )
}

// ─── Aba: Configurações ───────────────────────────────────────────────────
function TabConfig() {
  const [cfg, setCfg] = useState({ username: '', competitors: [], emails: [] })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/api/v1/instagram-os/config').then(r => r.json()).then(d => { setCfg(d); setLoading(false) })
  }, [])

  async function save() {
    const r = await api('/api/v1/instagram-os/config', { method: 'PUT', body: JSON.stringify(cfg) })
    if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  if (loading) return <p className="font-mono text-[12px] text-dust">Carregando…</p>

  return (
    <div className="max-w-2xl">
      {/* Username */}
      <div className="mb-6">
        <label className="block font-mono text-[11px] uppercase tracking-[0.2em] text-dust mb-2">
          Seu username no Instagram
        </label>
        <input
          value={cfg.username}
          onChange={e => setCfg(p => ({ ...p, username: e.target.value }))}
          placeholder="liveequipamentos"
          className="w-full bg-coal border border-wire font-mono text-[13px] text-paper px-3 py-2 focus:outline-none focus:border-onair placeholder:text-dust/40"
        />
      </div>

      {/* Concorrentes */}
      <TagList
        label="Concorrentes (usernames do Instagram)"
        items={cfg.competitors}
        placeholder="username_concorrente"
        onAdd={v => setCfg(p => ({ ...p, competitors: [...p.competitors, v] }))}
        onRemove={v => setCfg(p => ({ ...p, competitors: p.competitors.filter(c => c !== v) }))}
      />

      {/* Emails */}
      <TagList
        label="Emails para receber o relatório (máx. ilimitado)"
        items={cfg.emails}
        placeholder="seuemail@exemplo.com"
        onAdd={v => setCfg(p => ({ ...p, emails: [...p.emails, v] }))}
        onRemove={v => setCfg(p => ({ ...p, emails: p.emails.filter(e => e !== v) }))}
      />

      <div className="mt-2 p-3 border border-wire/40 bg-coal/40 font-mono text-[11px] text-dust leading-relaxed">
        <span className="text-paper">SMTP</span> — configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS no .env para envio de email.<br />
        Se não configurado, o relatório fica disponível apenas neste painel.
      </div>

      <button
        onClick={save}
        className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] border border-onair text-onair px-6 py-2.5 hover:bg-onair hover:text-ink transition-all"
      >
        {saved ? '✓ Salvo' : 'Salvar configurações'}
      </button>
    </div>
  )
}

// ─── Aba: Executar ────────────────────────────────────────────────────────
function TabRun() {
  const [status, setStatus] = useState({ status: 'idle', log: [], phase: null, startedAt: null, finishedAt: null, error: null })
  const logRef = useRef(null)

  useEffect(() => {
    const poll = () => api('/api/v1/instagram-os/status').then(r => r.json()).then(setStatus)
    poll()
    const id = setInterval(poll, 3000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [status.log])

  async function startRun() {
    const r = await api('/api/v1/instagram-os/run', { method: 'POST' })
    const d = await r.json()
    if (!r.ok) alert(d.error)
  }

  const phaseLabel = {
    'my-reels': 'Fase 1 — Meus reels',
    'competitors': 'Fase 2 — Concorrentes',
    'report': 'Fase 3 — Relatório estratégico',
  }

  return (
    <div className="max-w-3xl">
      {/* Status + botão */}
      <div className="flex items-center gap-4 mb-6">
        <StatusBadge status={status.status} />
        {status.phase && (
          <span className="font-mono text-[11px] text-onair tracking-[0.15em]">{phaseLabel[status.phase] || status.phase}</span>
        )}
        <div className="flex-1" />
        <button
          onClick={startRun}
          disabled={status.status === 'running'}
          className="font-mono text-[11px] uppercase tracking-[0.22em] border border-onair text-onair px-5 py-2 hover:bg-onair hover:text-ink transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ▶ Executar agora
        </button>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          ['Iniciado em', status.startedAt ? new Date(status.startedAt).toLocaleString('pt-BR') : '—'],
          ['Concluído em', status.finishedAt ? new Date(status.finishedAt).toLocaleString('pt-BR') : '—'],
        ].map(([k, v]) => (
          <div key={k} className="bg-coal border border-wire p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-dust mb-1">{k}</div>
            <div className="font-mono text-[12px] text-paper">{v}</div>
          </div>
        ))}
      </div>

      {status.error && (
        <div className="mb-4 p-3 border border-red-500/50 bg-red-900/20 font-mono text-[12px] text-red-400">
          ✕ {status.error}
        </div>
      )}

      {/* Log */}
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-dust">Log de execução</div>
      <div ref={logRef} className="h-72 overflow-y-auto bg-coal border border-wire p-3 font-mono text-[11px] leading-relaxed">
        {status.log.length === 0 ? (
          <span className="text-dust/40 italic">Aguardando execução…</span>
        ) : (
          status.log.map((entry, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-dust/50 shrink-0">{new Date(entry.t).toLocaleTimeString('pt-BR')}</span>
              <span className="text-paper">{entry.msg}</span>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 font-mono text-[11px] text-dust/60 leading-relaxed">
        O pipeline é executado automaticamente todo <span className="text-dust">domingo às 7h</span>.
        Clique em "Executar agora" para rodar manualmente a qualquer momento.<br />
        Duração estimada: 25–45 minutos (depende do número de concorrentes e disponibilidade das APIs).
      </div>
    </div>
  )
}

// ─── Aba: Relatório ───────────────────────────────────────────────────────
function TabReport() {
  const [hasReport, setHasReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/api/v1/instagram-os/reports').then(r => r.json()).then(list => {
      setHasReport(list.length > 0)
      setLoading(false)
    }).catch(() => { setHasReport(false); setLoading(false) })
  }, [])

  if (loading) return <p className="font-mono text-[12px] text-dust">Verificando relatórios…</p>

  if (!hasReport) {
    return (
      <div className="max-w-lg">
        <div className="border border-wire p-6 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-dust mb-2">Nenhum relatório ainda</div>
          <p className="font-mono text-[12px] text-paper/70">
            Execute o pipeline pela aba "Executar" para gerar o primeiro relatório.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-dust">Último relatório gerado</span>
        <div className="flex gap-3">
          <a
            href="https://social.liveuni.com.br/relatorio"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-dust border border-wire px-3 py-1.5 hover:border-paper hover:text-paper transition-all"
          >
            Relatório VPS ↗
          </a>
          <a
            href="/api/v1/instagram-os/report/html"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-onair border border-onair px-3 py-1.5 hover:bg-onair hover:text-ink transition-all"
          >
            Abrir em nova aba ↗
          </a>
        </div>
      </div>
      <iframe
        src="/api/v1/instagram-os/report/html"
        className="w-full rounded border border-wire bg-coal"
        style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}
        title="Instagram OS Report"
      />
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────
export default function InstagramOS() {
  const [tab, setTab] = useState('config')

  const tabs = [
    { id: 'config', label: 'Configurações' },
    { id: 'run',    label: 'Executar / Status' },
    { id: 'report', label: 'Relatório' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-dust">14</span>
          <h1 className="font-display text-4xl italic font-light text-paper">Instagram <span className="font-medium">OS</span></h1>
        </div>
        <p className="font-mono text-[12px] text-dust tracking-wide">
          Inteligência competitiva semanal — scraping · análise Gemini · estratégia Claude · relatório automático
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-wire mb-8">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`font-mono text-[12px] uppercase tracking-[0.22em] px-5 py-3 border-b-2 transition-colors ${
              tab === t.id
                ? 'text-paper border-onair'
                : 'text-dust border-transparent hover:text-paper'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'config' && <TabConfig />}
      {tab === 'run'    && <TabRun />}
      {tab === 'report' && <TabReport />}
    </div>
  )
}
