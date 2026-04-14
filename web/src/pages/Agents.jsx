const agents = [
  { id: 'caio-carrossel', role: 'Carrosséis', status: 'online', items: 18 },
  { id: 'davi-destaque', role: 'Reels & vídeos curtos', status: 'online', items: 12 },
  { id: 'elisa-efemera', role: 'Stories', status: 'online', items: 34 },
  { id: 'iris-influencer', role: 'Influencers de IA · personagens virtuais', status: 'online', items: 7 },
  { id: 'giovana-gancho', role: 'Ganchos & copy', status: 'idle', items: 22 },
  { id: 'bruno-balizador', role: 'Revisão de marca', status: 'online', items: 44 },
  { id: 'paula-postagem', role: 'Publicação', status: 'online', items: 9 },
  { id: 'amanda-anuncio', role: 'Criativos de anúncio', status: 'online', items: 5 },
  { id: 'fabio-funil', role: 'Funil & oferta', status: 'idle', items: 3 },
  { id: 'henrique-horizonte', role: 'Planejamento mensal', status: 'online', items: 2 },
]

export default function Agents() {
  return (
    <div>
      <section className="pb-10 mb-10 border-b border-wire">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-onair mb-5 rise">Squad · live-social-media</div>
        <h1 className="font-display text-[80px] leading-[0.92] font-light tracking-[-0.02em] text-paper rise">
          O <span className="italic">elenco</span>.
        </h1>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((a, i) => (
          <div key={a.id} className={`rise rise-${Math.min(i + 1, 5)} border border-wire p-5 bracketed text-paper hover:border-paper transition-colors group`}>
            <span className="br-tl" /><span className="br-tr" /><span className="br-bl" /><span className="br-br" />
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display italic text-2xl text-paper leading-tight">{a.id.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join(' ')}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust mt-1">{a.role}</div>
              </div>
              <div className={`flex items-center gap-2 ${a.status === 'online' ? 'text-signal' : 'text-amber'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${a.status === 'online' ? 'bg-signal' : 'bg-amber'}`} />
                <span className="font-mono text-[10px] uppercase tracking-[0.28em]">{a.status}</span>
              </div>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <div className="font-display text-4xl font-light text-paper">{a.items}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust mt-1">entregues</div>
              </div>
              <button className="font-mono text-[11px] uppercase tracking-[0.22em] text-dust group-hover:text-onair transition-colors">
                abrir →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
