import { useEffect, useState } from 'react'

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/analytics/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <div className="py-20 text-center font-display italic text-2xl text-dust">carregando…</div>
  if (!data || data.allTimePosts === 0) return (
    <div className="py-20 text-center">
      <div className="font-display italic text-3xl text-dust">Sem métricas ainda.</div>
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-wire mt-4">
        Publique algo, adicione a URL em /historico e capture métricas.
      </div>
    </div>
  )

  const t = data.totals
  return (
    <div>
      <section className="pb-8 mb-8 border-b border-wire">
        <div className="flex items-end justify-between gap-6">
          <div className="rise">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-onair mb-4">Dashboard · {data.month}</div>
            <h1 className="font-display text-[72px] leading-[0.92] font-light tracking-[-0.02em] text-paper">
              Performance<span className="text-onair">.</span>
            </h1>
          </div>
          <div className="rise rise-1 font-mono text-[10px] uppercase tracking-[0.3em] text-dust text-right">
            <div>{data.allTimePosts} posts com métricas</div>
            <div>Mês corrente · {t.posts} postagens</div>
          </div>
        </div>
      </section>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10 rise rise-2">
        <BigMetric label="Views" value={t.views} tone="paper" />
        <BigMetric label="Likes" value={t.likes} tone="onair" />
        <BigMetric label="Comentários" value={t.comments} tone="amber" />
        <BigMetric label="Engajamento" value={t.engagement} tone="signal" />
        <BigMetric label="Taxa eng." value={t.engagementRate != null ? t.engagementRate + '%' : '—'} tone="paper" rawValue />
      </div>

      {/* Top Posts */}
      <section className="mb-10">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-dust mb-4">Top Posts · por engagement</h2>
        {data.topPosts.length === 0 ? (
          <div className="font-mono text-[10px] text-wire py-6">sem posts com métricas</div>
        ) : (
          <div className="space-y-2">
            {data.topPosts.map((p, i) => (
              <div key={p.itemId} className="grid grid-cols-[40px_1fr_120px_200px_100px] gap-4 items-center border border-wire bg-coal px-4 py-3 hover:border-paper">
                <div className="font-display text-3xl font-light text-onair">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div className="font-display italic text-lg text-paper leading-tight line-clamp-1">{p.title}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-dust mt-0.5">{p.agent} · {p.type}</div>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-paper">{p.platform || '—'}</div>
                <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
                  <Metric label="views" value={p.metrics?.views} />
                  <Metric label="likes" value={p.metrics?.likes} />
                  <Metric label="cmts" value={p.metrics?.comments} />
                </div>
                <div className="text-right">
                  {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="font-mono text-[10px] uppercase tracking-widest text-onair hover:text-paper">abrir ↗</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Por agente */}
      <section className="mb-10">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-dust mb-4">Performance por agente</h2>
        <div className="border border-wire">
          <div className="grid grid-cols-[1fr_80px_140px_160px_1fr] gap-3 px-4 py-2 border-b border-wire font-mono text-[10px] uppercase tracking-widest text-dust bg-coal">
            <div>Agente</div><div>Posts</div><div>Views</div><div>Engagement</div><div>Share of engagement</div>
          </div>
          {data.agents.map((a, i) => {
            const total = data.agents.reduce((s, x) => s + x.engagement, 0) || 1
            const pct = (a.engagement / total) * 100
            return (
              <div key={a.agent} className="grid grid-cols-[1fr_80px_140px_160px_1fr] gap-3 px-4 py-3 border-b border-wire/40 items-center">
                <div className="font-display italic text-paper">{a.agent}</div>
                <div className="font-mono text-[11px] text-paper">{a.posts}</div>
                <div className="font-mono text-[11px] text-paper">{a.views.toLocaleString('pt-BR')}</div>
                <div className="font-mono text-[11px] text-onair">{a.engagement.toLocaleString('pt-BR')}</div>
                <div className="h-2 bg-ink relative">
                  <div className="absolute inset-y-0 left-0 bg-onair" style={{ width: pct + '%' }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Por plataforma */}
      <section>
        <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-dust mb-4">Por plataforma</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.platforms.map(p => (
            <div key={p.platform} className="border border-wire bg-coal p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-onair">{p.platform}</div>
              <div className="font-display text-4xl font-light text-paper mt-2">{p.views.toLocaleString('pt-BR')}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-dust mt-1">views · {p.posts} posts</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-signal mt-3">{p.engagement.toLocaleString('pt-BR')} engajamento</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function BigMetric({ label, value, tone = 'paper', rawValue }) {
  const color = tone === 'onair' ? 'text-onair' : tone === 'amber' ? 'text-amber' : tone === 'signal' ? 'text-signal' : 'text-paper'
  return (
    <div className="border border-wire bg-coal p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-dust mb-2">{label}</div>
      <div className={`font-display text-4xl font-light leading-none ${color}`}>
        {rawValue ? value : (value || 0).toLocaleString('pt-BR')}
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="text-dust uppercase tracking-widest text-[9px]">{label}</div>
      <div className="text-paper font-display not-italic text-sm">{value?.toLocaleString('pt-BR') || '—'}</div>
    </div>
  )
}
