import { useEffect, useMemo, useState } from 'react'

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

function startOfMonth(d) { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x }
function endOfMonth(d)   { const x = startOfMonth(d); x.setMonth(x.getMonth() + 1); return x }
function addMonths(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }
function sameDay(a, b)   { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate() }
function fmtBr(d)        { return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) }

export default function Agenda() {
  const [status, setStatus] = useState(null)
  const [cursor, setCursor] = useState(() => new Date())
  const [events, setEvents] = useState([])
  const [items, setItems] = useState([])
  const [showNew, setShowNew] = useState(null) // Date
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const st = await (await fetch('/api/v1/calendar/status')).json()
      setStatus(st)
      if (!st.configured) { setEvents([]); return }
      const from = startOfMonth(cursor).toISOString()
      const to = addMonths(startOfMonth(cursor), 2).toISOString()
      const evs = await (await fetch(`/api/v1/calendar/events?from=${from}&to=${to}`)).json()
      setEvents(Array.isArray(evs) ? evs : [])
      const it = await (await fetch('/api/v1/items')).json()
      setItems(Array.isArray(it) ? it : [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [cursor])

  const grid = useMemo(() => buildGrid(cursor), [cursor])

  return (
    <div>
      <section className="pb-8 mb-8 border-b border-wire">
        <div className="flex items-end justify-between gap-6">
          <div className="rise">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-onair mb-4">Programação · Editorial</div>
            <h1 className="font-display text-[72px] leading-[0.92] font-light tracking-[-0.02em] text-paper">
              Agenda<span className="text-onair">.</span>
            </h1>
          </div>
          <div className="rise rise-1 flex items-center gap-3">
            <button onClick={() => setCursor(addMonths(cursor, -1))} className="font-mono text-[11px] uppercase tracking-[0.22em] text-dust border border-wire px-3 py-2 hover:text-paper hover:border-paper">← mês</button>
            <div className="font-display italic text-2xl text-paper min-w-[200px] text-center">
              {cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </div>
            <button onClick={() => setCursor(addMonths(cursor, 1))} className="font-mono text-[11px] uppercase tracking-[0.22em] text-dust border border-wire px-3 py-2 hover:text-paper hover:border-paper">mês →</button>
            <button onClick={() => setCursor(new Date())} className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper border border-paper px-3 py-2 hover:bg-paper hover:text-ink">hoje</button>
          </div>
        </div>
      </section>

      {status && !status.configured && <SetupGuide hint={status.hint} />}

      {status?.configured && (
        <>
          <div className="grid grid-cols-7 gap-px bg-wire border border-wire">
            {WEEKDAYS.map(w => (
              <div key={w} className="bg-ink p-2 font-mono text-[10px] uppercase tracking-widest text-dust text-center">{w}</div>
            ))}
            {grid.map((d, i) => {
              const dayEvents = events.filter(e => e.startAt && sameDay(new Date(e.startAt), d))
              const isCurrentMonth = d.getMonth() === cursor.getMonth()
              const isToday = sameDay(d, new Date())
              return (
                <button
                  key={i}
                  onClick={() => setShowNew(d)}
                  className={`bg-coal min-h-[120px] p-2 text-left hover:bg-graphite transition-colors ${isCurrentMonth ? '' : 'opacity-40'} ${isToday ? 'ring-2 ring-onair ring-inset' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-mono text-[11px] ${isToday ? 'text-onair' : 'text-paper'}`}>{String(d.getDate()).padStart(2,'0')}</span>
                    {dayEvents.length > 0 && (
                      <span className="font-mono text-[9px] uppercase tracking-widest text-dust">{dayEvents.length}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div key={ev.id} className={`text-[11px] border-l-2 pl-1.5 py-0.5 ${colorClass(ev.status)}`}>
                        <div className="font-sans text-paper truncate">{ev.title}</div>
                        <div className="font-mono text-[9px] uppercase tracking-widest text-dust">
                          {new Date(ev.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {ev.networks?.join(',') || '—'}
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 3 && <div className="font-mono text-[9px] text-dust">+{dayEvents.length - 3} mais</div>}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Legenda */}
          <div className="mt-6 flex gap-6 font-mono text-[10px] uppercase tracking-widest text-dust">
            <Legend color="border-amber" label="Agendado" />
            <Legend color="border-signal" label="Aprovado" />
            <Legend color="border-[#4a73ff]" label="Rascunho" />
            <Legend color="border-dust" label="Publicado" />
          </div>

          {loading && <div className="mt-6 font-mono text-[10px] text-dust">carregando…</div>}

          {showNew && (
            <NewEventModal
              date={showNew}
              items={items}
              onClose={() => setShowNew(null)}
              onSaved={() => { setShowNew(null); load() }}
            />
          )}
        </>
      )}
    </div>
  )
}

function buildGrid(cursor) {
  const start = startOfMonth(cursor)
  const startDow = start.getDay()
  const first = new Date(start); first.setDate(first.getDate() - startDow)
  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(first); d.setDate(first.getDate() + i)
    cells.push(d)
  }
  return cells
}

function Legend({ color, label }) {
  return <span className="flex items-center gap-2"><span className={`w-3 h-0.5 border-l-2 ${color}`} />{label}</span>
}

function colorClass(status) {
  return {
    scheduled: 'border-amber',
    approved: 'border-signal',
    draft: 'border-[#4a73ff]',
    posted: 'border-dust',
  }[status] || 'border-wire'
}

function NewEventModal({ date, items, onClose, onSaved }) {
  const [title, setTitle] = useState('')
  const [itemId, setItemId] = useState('')
  const [time, setTime] = useState('09:00')
  const [networks, setNetworks] = useState(['instagram_feed'])
  const [status, setStatus] = useState('scheduled')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  async function save() {
    setBusy(true); setErr(null)
    try {
      const [h, m] = time.split(':').map(Number)
      const start = new Date(date); start.setHours(h, m, 0, 0)
      const body = {
        title: title || (itemId ? items.find(i => i.id === itemId)?.title : 'Sem título'),
        startAt: start.toISOString(),
        itemId, networks, status,
      }
      const res = await fetch('/api/v1/calendar/events', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'erro')
      onSaved?.()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  const toggleNet = (n) => setNetworks(v => v.includes(n) ? v.filter(x => x !== n) : [...v, n])

  return (
    <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="relative max-w-xl w-full bg-coal border border-wire bracketed text-paper">
        <span className="br-tl" /><span className="br-tr" /><span className="br-bl" /><span className="br-br" />
        <div className="px-6 py-5 border-b border-wire flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-onair">Agendar post</div>
            <h2 className="font-display italic text-2xl text-paper mt-1">{fmtBr(date)}</h2>
          </div>
          <button onClick={onClose} className="text-dust hover:text-paper">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-1">Material (opcional)</label>
            <select value={itemId} onChange={e => setItemId(e.target.value)}
              className="w-full bg-ink border border-wire text-paper p-2 text-sm font-sans focus:outline-none focus:border-paper">
              <option value="">— nenhum (título livre) —</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.title || i.id}</option>)}
            </select>
          </div>

          {!itemId && (
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-1">Título</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-ink border border-wire text-paper p-2 text-sm font-sans focus:outline-none focus:border-paper" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-1">Horário</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full bg-ink border border-wire text-paper p-2 text-sm font-mono focus:outline-none focus:border-paper" />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full bg-ink border border-wire text-paper p-2 text-sm font-sans focus:outline-none focus:border-paper">
                <option value="scheduled">Agendado</option>
                <option value="approved">Aprovado</option>
                <option value="draft">Rascunho</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-2">Redes</label>
            <div className="flex flex-wrap gap-2">
              {['instagram_feed','instagram_reel','instagram_story','tiktok','linkedin'].map(n => (
                <button key={n} onClick={() => toggleNet(n)}
                  className={`font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border transition-colors
                    ${networks.includes(n) ? 'border-paper text-paper bg-paper/5' : 'border-wire text-dust hover:text-paper'}`}>
                  {n.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {err && <div className="font-mono text-[11px] text-onair border border-onair/60 p-2">erro: {err}</div>}
        </div>
        <div className="px-6 py-4 border-t border-wire flex justify-end gap-2">
          <button onClick={onClose} className="font-mono text-[11px] uppercase tracking-widest text-dust border border-wire px-4 py-2 hover:text-paper hover:border-paper">cancelar</button>
          <button onClick={save} disabled={busy}
            className="font-mono text-[11px] uppercase tracking-widest text-paper bg-onair border border-onair px-5 py-2 hover:bg-[#C9241E] disabled:opacity-40">
            {busy ? 'salvando…' : 'agendar →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SetupGuide({ hint }) {
  return (
    <div className="border border-amber/40 bg-amber/5 p-6 rounded-sm">
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber mb-2">Setup Google Calendar</div>
      <p className="font-sans text-sm text-bone leading-relaxed whitespace-pre-wrap">{hint}</p>
    </div>
  )
}
