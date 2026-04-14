// Previews realistas para cada rede.
// Renderizam a partir do mesmo item — zero divergência entre preview e publicação.

function truncate(s, n) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n) + '…' : s
}

export function InstagramFeedPreview({ m }) {
  const firstSlide = m.slides?.[0]
  return (
    <div className="w-full max-w-[360px] bg-black text-white border border-wire rounded-sm overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber via-onair to-[#833AB4] p-[1.5px]">
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-mono">LU</div>
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold">liveequipamentos</div>
          <div className="text-[10px] text-neutral-400">São Paulo</div>
        </div>
        <div className="text-neutral-400 text-lg leading-none">⋯</div>
      </div>
      {/* Image */}
      <div className="relative aspect-[4/5] bg-gradient-to-br from-neutral-900 to-black">
        <div className="absolute inset-0 flex items-end p-5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-onair mb-1.5">slide 1 / {m.slides?.length || 1}</div>
            <div className="font-display italic text-[26px] leading-[1.05] font-light">{firstSlide?.headline}</div>
            {firstSlide?.sub && <div className="text-[12px] text-neutral-300 mt-1.5 max-w-[220px]">{firstSlide.sub}</div>}
          </div>
        </div>
        {m.slides?.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/60 rounded-full px-2 py-0.5 text-[10px] font-mono">1/{m.slides.length}</div>
        )}
      </div>
      {/* Actions */}
      <div className="flex items-center gap-4 px-3 py-2 text-xl">
        <span>♡</span><span>💬</span><span>↗</span>
        <span className="flex-1" />
        <span>⊟</span>
      </div>
      {/* Caption */}
      <div className="px-3 pb-3 text-[12px] leading-snug">
        <span className="font-semibold">liveequipamentos</span>{' '}
        <span className="text-neutral-200">{truncate(m.caption?.split('\n')[0], 110)}</span>
        <div className="text-neutral-500 text-[11px] mt-1">ver tradução</div>
        <div className="text-neutral-500 text-[10px] mt-1 uppercase tracking-wide">há 2 min</div>
      </div>
    </div>
  )
}

export function InstagramStoryPreview({ m }) {
  return (
    <div className="w-full max-w-[220px] aspect-[9/16] bg-gradient-to-b from-amber/50 via-onair/30 to-black text-white border border-wire rounded-md overflow-hidden relative font-sans">
      <div className="absolute inset-x-3 top-3 flex gap-1">
        {Array.from({ length: m.frames || 4 }).map((_, i) => (
          <span key={i} className={`h-[2px] flex-1 ${i === 0 ? 'bg-white' : 'bg-white/30'}`} />
        ))}
      </div>
      <div className="absolute inset-x-3 top-7 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-white/90 text-black flex items-center justify-center text-[9px] font-mono">LU</div>
        <div className="text-[11px] font-medium">liveequipamentos</div>
        <div className="text-[10px] text-white/70">há 2m</div>
      </div>
      <div className="absolute bottom-8 inset-x-4">
        <div className="font-display italic text-2xl leading-tight">{m.title}</div>
        {m.caption && <div className="text-[11px] text-white/80 mt-1">{truncate(m.caption, 80)}</div>}
      </div>
      <div className="absolute bottom-2 inset-x-4 flex items-center gap-2 text-[11px] text-white/60">
        <div className="flex-1 border border-white/40 rounded-full px-3 py-1.5">Envie mensagem…</div>
        <span>♡</span><span>↗</span>
      </div>
    </div>
  )
}

export function TikTokPreview({ m }) {
  return (
    <div className="w-full max-w-[220px] aspect-[9/16] bg-black text-white border border-wire rounded-md overflow-hidden relative font-sans">
      {/* Video bg */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(37,244,238,.2),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(255,20,120,.2),transparent_60%)]" />
      {/* Top */}
      <div className="absolute top-3 inset-x-0 flex items-center justify-center gap-5 text-[12px]">
        <span className="text-white/60">Seguindo</span>
        <span className="font-semibold">Para você</span>
      </div>
      {/* Center play */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border border-white/80 flex items-center justify-center">
          <div className="w-0 h-0 border-y-[7px] border-y-transparent border-l-[10px] border-l-white ml-0.5" />
        </div>
      </div>
      {/* Right actions */}
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4 text-[10px]">
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-lg">♥</div>
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-lg">💬</div>
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-lg">↗</div>
      </div>
      {/* Bottom */}
      <div className="absolute bottom-3 inset-x-3 pr-12">
        <div className="text-[12px] font-semibold">@liveequipamentos</div>
        <div className="text-[11px] text-white/90 mt-1">{truncate(m.caption?.split('\n')[0] || m.title, 90)}</div>
        <div className="text-[10px] text-white/60 mt-1.5">♪ som original · liveuniverse</div>
      </div>
    </div>
  )
}

export function LinkedInPreview({ m }) {
  return (
    <div className="w-full max-w-[380px] bg-[#1B1F23] text-white border border-wire rounded-sm overflow-hidden font-sans">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center text-xs font-bold">LE</div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold">Live Equipamentos</div>
          <div className="text-[11px] text-neutral-400">Equipamentos de Pilates · 2.4k seguidores</div>
          <div className="text-[10px] text-neutral-500">há 2 min · 🌐</div>
        </div>
      </div>
      <div className="px-4 pb-3 text-[13px] leading-relaxed">
        {truncate(m.caption || m.title, 220)}
      </div>
      <div className="aspect-[4/5] bg-gradient-to-br from-neutral-900 to-black flex items-end p-5">
        <div>
          <div className="font-display italic text-[24px] leading-tight">{m.slides?.[0]?.headline || m.title}</div>
        </div>
      </div>
      <div className="flex items-center justify-around px-2 py-2 text-[11px] text-neutral-400 border-t border-white/10">
        <span>👍 Curtir</span><span>💬 Comentar</span><span>↗ Compartilhar</span><span>📤 Enviar</span>
      </div>
    </div>
  )
}
