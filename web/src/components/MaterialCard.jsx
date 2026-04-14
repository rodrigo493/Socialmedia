import { Link } from 'react-router-dom'
import { typeLabel } from '../data/mock'

const statusStyle = {
  pending_approval: { label: 'Aguardando', dot: 'bg-amber', text: 'text-amber' },
  approved: { label: 'Aprovado', dot: 'bg-signal', text: 'text-signal' },
  posted: { label: 'Publicado', dot: 'bg-dust', text: 'text-dust' },
}

function CarouselPreview({ slides, media }) {
  const firstImage = media?.find?.(m => m.role === 'slide' || !m.role)
  if (firstImage) {
    return (
      <div className="relative aspect-[4/5] bg-black overflow-hidden">
        <img src={`/media/criados/${firstImage.path}`} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-x-6 top-6 flex gap-1">
          {(slides || []).map((_, i) => (
            <span key={i} className={`h-[2px] flex-1 ${i === 0 ? 'bg-paper' : 'bg-paper/30'}`} />
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="relative aspect-[4/5] bg-gradient-to-br from-coal to-ink overflow-hidden">
      <div className="absolute inset-0 flex items-end p-6">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-onair mb-2">slide 01 · de {slides?.length || 5}</div>
          <h3 className="font-display text-[28px] leading-[1.02] italic font-light text-paper max-w-[220px]">
            {slides?.[0]?.headline}
          </h3>
          {slides?.[0]?.sub && <p className="font-sans text-sm text-dust mt-2 max-w-[240px]">{slides[0].sub}</p>}
        </div>
      </div>
      <div className="absolute inset-x-6 top-6 flex gap-1">
        {(slides || []).map((_, i) => (
          <span key={i} className={`h-[2px] flex-1 ${i === 0 ? 'bg-paper' : 'bg-wire'}`} />
        ))}
      </div>
    </div>
  )
}

function ReelPreview({ duration }) {
  return (
    <div className="relative aspect-[4/5] bg-ink2 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(229,50,43,.25),transparent_60%)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border border-paper/60 flex items-center justify-center">
          <div className="w-0 h-0 border-y-[8px] border-y-transparent border-l-[12px] border-l-paper ml-1" />
        </div>
      </div>
      <div className="absolute top-4 right-4 font-mono text-[10px] text-paper bg-ink/70 px-2 py-1 border border-wire">
        ▸ {duration || '00:21'}
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[9px] uppercase tracking-[0.3em] text-dust">9:16</div>
    </div>
  )
}

function StoryPreview({ frames }) {
  return (
    <div className="relative aspect-[4/5] bg-gradient-to-b from-amber/30 via-onair/20 to-ink overflow-hidden">
      <div className="absolute inset-x-6 top-4 flex gap-1">
        {Array.from({ length: frames || 3 }).map((_, i) => (
          <span key={i} className="h-[2px] flex-1 bg-paper/80" />
        ))}
      </div>
      <div className="absolute bottom-6 left-6 right-6">
        <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-paper/80 mb-1">ephemeral · 24h</div>
        <div className="font-display italic text-2xl text-paper leading-tight">Bastidor</div>
      </div>
    </div>
  )
}

function InfluencerPreview({ metrics }) {
  return (
    <div className="relative aspect-[4/5] bg-coal overflow-hidden p-6 flex flex-col justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-onair to-amber" />
        <div>
          <div className="font-display italic text-lg text-paper">@mariana.silva</div>
          <div className="font-mono text-[10px] text-dust uppercase tracking-widest">creator</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 font-mono text-[10px] uppercase tracking-widest">
        <div>
          <div className="text-dust">followers</div>
          <div className="text-paper text-xl font-display not-italic mt-1">{metrics?.followers}</div>
        </div>
        <div>
          <div className="text-dust">eng.</div>
          <div className="text-paper text-xl font-display not-italic mt-1">{metrics?.engagement}</div>
        </div>
        <div>
          <div className="text-dust">fit</div>
          <div className="text-signal text-xl font-display not-italic mt-1">{metrics?.fit}</div>
        </div>
      </div>
    </div>
  )
}

function PreviewFor({ m }) {
  if (m.type === 'carousel') return <CarouselPreview slides={m.slides} media={m.media} />
  if (m.type === 'reel' || m.type === 'tiktok') return <ReelPreview duration={m.duration} />
  if (m.type === 'story') return <StoryPreview frames={m.frames} />
  if (m.type === 'influencer_brief') {
    const charImg = m.media?.find(x => x.role === 'character_sheet')
    if (charImg) return (
      <div className="relative aspect-[4/5] bg-black overflow-hidden">
        <img src={`/media/criados/${charImg.path}`} alt="" className="absolute inset-0 w-full h-full object-cover" />
      </div>
    )
    return <InfluencerPreview metrics={m.metrics} />
  }
  return <div className="aspect-[4/5] bg-coal" />
}

export default function MaterialCard({ m, index = 0 }) {
  const s = statusStyle[m.status] || statusStyle.pending_approval
  return (
    <Link
      to={`/material/${m.id}`}
      className={`rise rise-${Math.min(index + 1, 5)} group block bracketed text-paper border border-wire hover:border-paper transition-colors`}
    >
      <span className="br-tl" /><span className="br-tr" /><span className="br-bl" /><span className="br-br" />

      {/* Header meta */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-wire">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-paper">
            {typeLabel[m.type] || m.type}
          </span>
          <span className="font-mono text-[10px] text-wire">·</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-dust">{m.agent}</span>
        </div>
        <div className={`flex items-center gap-2 ${s.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em]">{s.label}</span>
        </div>
      </div>

      <PreviewFor m={m} />

      {/* Body */}
      <div className="p-4 border-t border-wire">
        <h3 className="font-display text-[19px] leading-[1.15] text-paper font-light group-hover:text-paper">
          {m.title}
        </h3>
        <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-dust">
          <span>{new Date(m.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-paper group-hover:text-onair transition-colors">Abrir →</span>
        </div>
      </div>
    </Link>
  )
}
