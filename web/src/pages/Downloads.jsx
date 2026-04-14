import { useEffect, useState } from 'react'

const PACKS = [
  { id: 'criados', label: 'Criados', description: 'Todos os materiais gerados (carrosséis, reels, personas, vídeos)', color: 'text-onair' },
  { id: 'products', label: 'Produtos', description: 'Catálogo completo de equipamentos + fotos', color: 'text-amber' },
  { id: 'reports', label: 'Relatórios', description: 'JSONs de inteligência competitiva', color: 'text-signal' },
  { id: 'investigations', label: 'Investigações', description: 'Scraping bruto dos concorrentes analisados pelo squad', color: 'text-paper' },
  { id: 'brand', label: 'Marca', description: 'company.md + preferences.md (memória dos agentes)', color: 'text-bone' },
]

export default function Downloads() {
  const [summary, setSummary] = useState(null)
  const [items, setItems] = useState([])

  useEffect(() => {
    fetch('/api/v1/export/summary').then(r => r.json()).then(setSummary).catch(() => {})
    fetch('/api/v1/items').then(r => r.json()).then(x => setItems(Array.isArray(x) ? x : [])).catch(() => {})
  }, [])

  function dl(url) {
    window.location.href = url
  }

  return (
    <div>
      <section className="pb-8 mb-8 border-b border-wire">
        <div className="rise">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-onair mb-4">Exportação</div>
          <h1 className="font-display text-[72px] leading-[0.92] font-light tracking-[-0.02em] text-paper">
            Downloads<span className="text-onair">.</span>
          </h1>
          <p className="font-display text-xl italic text-dust max-w-xl mt-5">
            Baixe qualquer conteúdo da plataforma. ZIPs empacotados no servidor.
          </p>
        </div>
      </section>

      {/* Backup full */}
      <div className="rise rise-1 border border-onair bg-onair/5 p-6 mb-8 bracketed text-paper">
        <span className="br-tl" /><span className="br-tr" /><span className="br-bl" /><span className="br-br" />
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-onair mb-1">Backup completo</div>
            <h3 className="font-display italic text-3xl text-paper">Tudo num ZIP só</h3>
            <p className="text-dust font-sans text-sm mt-1">Criados + Produtos + Relatórios + Investigações + Memória de marca</p>
          </div>
          <button onClick={() => dl('/api/v1/export/backup')}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper bg-onair border border-onair px-6 py-4 hover:bg-[#C9241E]">
            ⬇ Baixar backup
          </button>
        </div>
      </div>

      {/* Pacotes por área */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {PACKS.map((p, i) => (
          <div key={p.id} className={`rise rise-${Math.min(i + 1, 5)} border border-wire bg-coal p-5 flex items-center justify-between gap-4`}>
            <div>
              <div className={`font-mono text-[10px] uppercase tracking-[0.3em] ${p.color} mb-1`}>{p.label}</div>
              <div className="font-display italic text-xl text-paper">
                {summary?.[p.id] != null && <span className="text-dust text-sm not-italic font-mono mr-2">{summary[p.id]}</span>}
                {p.description}
              </div>
            </div>
            <button onClick={() => dl(`/api/v1/export/${p.id}`)}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper border border-paper px-4 py-2 hover:bg-paper hover:text-ink whitespace-nowrap">
              ⬇ ZIP
            </button>
          </div>
        ))}
      </div>

      {/* Lista de items — download individual */}
      <section>
        <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-dust mb-4">Itens criados · download individual</h2>
        {items.length === 0 ? (
          <div className="font-mono text-[10px] uppercase tracking-widest text-wire py-6">nada criado ainda</div>
        ) : (
          <div className="border border-wire bracketed text-paper">
            <span className="br-tl" /><span className="br-tr" /><span className="br-bl" /><span className="br-br" />
            <div className="grid grid-cols-[1fr_120px_160px_120px] gap-4 px-4 py-2 border-b border-wire font-mono text-[10px] uppercase tracking-widest text-dust bg-coal">
              <div>Item</div><div>Tipo</div><div>Status</div><div className="text-right">Ação</div>
            </div>
            {items.map(i => (
              <div key={i.id} className="grid grid-cols-[1fr_120px_160px_120px] gap-4 px-4 py-3 border-b border-wire/40 items-center hover:bg-coal/50">
                <div>
                  <div className="font-display italic text-paper text-lg leading-tight">{i.title || i.id}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-dust mt-0.5">{i.id}</div>
                </div>
                <div className="font-mono text-[11px] uppercase text-paper">{i.type}</div>
                <div className="font-mono text-[11px] text-dust">{i.status || '—'}</div>
                <div className="text-right">
                  <button onClick={() => dl(`/api/v1/export/item/${i.id}`)}
                    className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper border border-wire px-3 py-1.5 hover:border-paper hover:text-onair">
                    ⬇ ZIP
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
