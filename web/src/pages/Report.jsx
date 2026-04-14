import { useReport } from '../hooks/useReport'

// Visual do relatório: folha branca sobre canvas escuro, como um documento aberto
// no control room. Mantém o layout fiel ao PDF original (azul/clean) mas enquadrado
// pela moldura editorial da app.

function highlight(text) {
  // Destaca a palavra "eu" com fundo amber, como no original.
  return text.split(/(\beu\b)/gi).map((part, i) =>
    /^eu$/i.test(part) ? <mark key={i} className="bg-yellow-200 text-slate-900 px-0.5 rounded">{part}</mark> : <span key={i}>{part}</span>
  )
}

export default function Report() {
  const { loading, data: r, error, source } = useReport()

  if (loading) {
    return (
      <div className="py-32 text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-onair mb-4">◉ carregando pesquisa</div>
        <div className="font-display italic text-3xl text-dust">Lendo as investigações do squad…</div>
      </div>
    )
  }

  if (!r) {
    return (
      <div className="py-32 text-center">
        <div className="font-display italic text-4xl text-dust">Sem relatório disponível.</div>
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-wire mt-4">{error}</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header editorial (mantém identidade do painel) */}
      <section className="pb-8 mb-10 border-b border-wire">
        <div className="flex items-end justify-between gap-8">
          <div className="rise">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-onair mb-5">
              Dossiê · Inteligência Competitiva
            </div>
            <h1 className="font-display text-[72px] leading-[0.92] font-light tracking-[-0.02em] text-paper">
              Campo de <span className="italic">visão</span><span className="text-onair">.</span>
            </h1>
            <p className="font-display text-xl italic text-dust max-w-xl mt-5">
              O que os concorrentes estão fazendo. O que funcionou. O que a gente grava em seguida.
            </p>
          </div>
          <div className="rise rise-1 text-right font-mono text-[10px] uppercase tracking-[0.3em] text-dust space-y-1">
            <div>Preparado para · <span className="text-paper">{r.meta.preparedFor}</span></div>
            <div>Período · <span className="text-paper">{r.meta.period}</span></div>
            <div>Data · <span className="text-paper">{r.meta.date}</span></div>
            <div>Squad · <span className="text-paper">{r.meta.preparedBy}</span></div>
          </div>
        </div>
      </section>

      {/* Document sheet */}
      <article className="rise rise-2 relative mx-auto max-w-5xl bg-white text-slate-800 shadow-2xl">
        <div className="absolute -top-3 left-8 flex gap-2">
          <span className="w-2 h-2 rounded-full bg-onair" />
          <span className="w-2 h-2 rounded-full bg-amber" />
          <span className="w-2 h-2 rounded-full bg-signal" />
        </div>

        <div className="px-10 md:px-14 py-14 md:py-16 space-y-16">
          {/* Top Competitor Videos */}
          <Section icon="🏆" title="Top Competitor Videos">
            <div className="space-y-4">
              {r.topVideos.map(v => (
                <div key={v.rank} className="border-l-[3px] border-blue-600 bg-slate-50 rounded-md">
                  <div className="px-5 pt-4 pb-3">
                    <span className="inline-block bg-blue-600 text-white text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                      Rank #{v.rank}
                    </span>
                    <h3 className="mt-3 text-[17px] font-bold text-slate-900">"{v.title}"</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-slate-600">
                      <span>👀 <b className="text-slate-800">Views:</b> {v.views.toLocaleString('en-US')}</span>
                      <span>👤 <b className="text-slate-800">Creator:</b> {v.creator}</span>
                      <span>📅 <b className="text-slate-800">Posted:</b> {new Date(v.postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <a href={v.url} className="mt-1 inline-block text-blue-600 text-[13px] hover:underline">View Original Post →</a>
                  </div>
                  <div className="mx-4 mb-4 bg-white border border-slate-200 rounded p-4">
                    <div className="text-[12px] font-bold text-slate-700 mb-2">Why It Worked:</div>
                    <p className="text-[13px] leading-relaxed text-slate-700">{v.whyItWorked}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Winning Patterns */}
          <Section icon="📈" title="Winning Patterns">
            <div className="space-y-6">
              {r.winningPatterns.map((p, i) => (
                <div key={i}>
                  <h3 className="text-blue-700 font-bold text-[16px] mb-2">{p.title}</h3>
                  <p className="text-[13px] leading-relaxed text-slate-700">{p.body}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Hook Ideas */}
          <Section icon="💡" title="Hook Ideas">
            <div className="space-y-4">
              {r.hooks.map(h => (
                <div key={h.n} className="border border-slate-200 rounded-md overflow-hidden">
                  <div className="px-5 pt-4">
                    <span className="inline-block bg-blue-600 text-white text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                      Hook #{h.n}
                    </span>
                    <h3 className="mt-3 text-[16px] font-bold text-slate-900">"{h.quote}"</h3>
                  </div>
                  <div className="m-4 bg-slate-50 border border-slate-200 rounded p-4">
                    <p className="text-[13px] leading-relaxed text-slate-700">{highlight(h.analysis)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Roteiros */}
          <Section icon="🎬" title="Roteiros de Vídeo (Prontos para Gravar)">
            <div className="space-y-5">
              {r.scripts.map(s => (
                <div key={s.n} className="border border-slate-200 rounded-md overflow-hidden">
                  <div className="px-5 pt-4 flex items-center gap-3">
                    <span className="inline-block bg-emerald-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                      Roteiro #{s.n}
                    </span>
                    <span className="text-[12px] text-slate-500">⏱ {s.duration}</span>
                  </div>
                  <div className="px-5 py-2 text-[12px] italic text-slate-500">
                    Baseado em: <span className="not-italic">{s.basedOn}</span>
                  </div>
                  <div className="mx-4 mb-4 bg-slate-50 border border-slate-200 rounded p-4">
                    <pre className="font-mono text-[12px] leading-relaxed text-slate-800 whitespace-pre-wrap break-words">
                      {highlight(s.body)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Key Takeaway */}
          <section>
            <div className="rounded-md bg-gradient-to-br from-blue-700 to-blue-900 text-white p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-7 rounded-full bg-onair flex items-center justify-center text-white text-sm">◉</span>
                <h2 className="text-[22px] font-bold">Key Takeaway</h2>
              </div>
              <p className="text-[13px] leading-relaxed mb-6 text-white/95">{r.keyTakeaway.summary}</p>

              <div className="font-bold text-[13px] uppercase tracking-wider mb-4 text-white">**Testar imediatamente:**</div>
              <ul className="space-y-4">
                {r.keyTakeaway.actions.map((a, i) => (
                  <li key={i} className="flex gap-3 text-[13px] leading-relaxed">
                    <span className="text-white/70 mt-0.5">■</span>
                    <span>
                      <b className="text-white">{a.title}</b> — <span className="text-white/90">{a.body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Footer of document */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono uppercase tracking-widest">
            <span>{r.meta.title}</span>
            <span>Pág. 1 de 1 · {r.meta.date}</span>
          </div>
        </div>
      </article>

      {/* Actions */}
      <div className="max-w-5xl mx-auto mt-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="font-mono text-[11px] uppercase tracking-[0.22em] text-dust border border-wire px-4 py-3 hover:text-paper hover:border-paper transition-colors">
            Imprimir / PDF
          </button>
          <button
            onClick={async () => {
              const res = await fetch('/api/v1/reports/generate', { method: 'POST' })
              const body = await res.json()
              alert(body.instruction || 'Ok')
            }}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper border border-onair px-4 py-3 hover:bg-onair transition-colors"
          >
            Gerar nova pesquisa →
          </button>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust flex items-center gap-3">
          <span className={`w-1.5 h-1.5 rounded-full ${source === 'api' ? 'bg-signal' : 'bg-amber'}`} />
          {source === 'api' ? 'dados ao vivo · API' : 'fallback local · ' + (error || '')}
          <span className="text-wire">·</span>
          <span>Por {r.meta.preparedBy}</span>
        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, children }) {
  return (
    <section>
      <div className="border-b-2 border-blue-500 pb-2 mb-5 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h2 className="text-[20px] font-bold text-blue-700">{title}</h2>
      </div>
      {children}
    </section>
  )
}
