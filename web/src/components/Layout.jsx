import { NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import CreditsBadge from './CreditsBadge'

const nav = [
  { to: '/', label: 'Inbox', code: '01' },
  { to: '/chat', label: 'Chat', code: '02' },
  { to: '/criados', label: 'Criados', code: '03' },
  { to: '/agenda', label: 'Agenda', code: '04' },
  { to: '/produtos', label: 'Produtos', code: '05' },
  { to: '/biblioteca', label: 'Biblioteca', code: '06' },
  { to: '/marca', label: 'Marca', code: '07' },
  { to: '/relatorio', label: 'Relatório', code: '08' },
  { to: '/historico', label: 'Histórico', code: '09' },
  { to: '/analytics', label: 'Analytics', code: '10' },
  { to: '/heygen', label: 'HeyGen', code: '11' },
  { to: '/downloads', label: 'Downloads', code: '12' },
  { to: '/agentes', label: 'Agentes', code: '13' },
  { to: '/instagram-os', label: 'Instagram OS', code: '14' },
]

function Clock() {
  const now = new Date()
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const date = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  return (
    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-dust">
      <span className="text-paper">{time}</span> <span className="text-wire">/</span> {date} <span className="text-wire">/</span> SP
    </div>
  )
}

function Marquee() {
  const items = [
    'CONTROL ROOM ACTIVE',
    '10 AGENTES ONLINE',
    'QUEUE · 03 PENDENTES',
    'LAST PUBLISH · 2h14m',
    'INSTAGRAM · OK',
    'TIKTOK · OK',
    'LINKEDIN · OK',
    'SIGNAL · STABLE',
  ]
  const line = items.join('  ✦  ')
  return (
    <div className="border-y border-wire bg-coal overflow-hidden">
      <div className="flex whitespace-nowrap py-2 marquee-track">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-dust px-6">{line}  ✦  {line}  ✦  </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-dust px-6">{line}  ✦  {line}  ✦  </span>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const loc = useLocation()
  const [hasLogo, setHasLogo] = useState(false)
  const [logoV, setLogoV] = useState(Date.now())
  useEffect(() => {
    const load = () => fetch('/api/v1/brand/logo').then(r => r.json())
      .then(d => { setHasLogo(!!d.hasLogo); setLogoV(Date.now()) }).catch(() => {})
    load()
    const fn = () => load()
    window.addEventListener('brand:logo-updated', fn)
    return () => window.removeEventListener('brand:logo-updated', fn)
  }, [loc.pathname])

  return (
    <div className="min-h-screen grain scanlines relative">
      {/* Top bar — 2 linhas: logo+infos em cima, nav embaixo */}
      <header className="sticky top-0 z-40 bg-ink/90 backdrop-blur-md border-b border-wire">
        {/* Linha 1: Logo + infos da direita */}
        <div className="max-w-[1600px] mx-auto px-8 py-4 flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <span className="flex items-center gap-2">
              <span className="onair-dot w-2.5 h-2.5 rounded-full bg-onair"></span>
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-onair">ON AIR</span>
            </span>
            {hasLogo ? (
              <span className="relative inline-flex items-center justify-center ml-2">
                <span className="logo-ring"></span>
                <span className="logo-ring delay"></span>
                <img
                  src={`/api/v1/brand/logo/image?v=${logoV}`}
                  alt="Live"
                  className="logo-aura relative h-[7.5rem] w-auto max-w-[480px] object-contain"
                />
              </span>
            ) : (
              <span className="font-display text-5xl italic font-light tracking-tight text-paper ml-2">
                Live<span className="font-medium">Universe</span>
              </span>
            )}
          </Link>

          <div className="flex-1" />

          <CreditsBadge />
          <Clock />
          <div className="w-px h-6 bg-wire" />
          <button
            onClick={() => { localStorage.removeItem('live-auth-token'); window.location.href = '/login' }}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper border border-wire px-3 py-2 hover:border-onair hover:text-onair transition-colors"
            title="Sair"
          >
            sair ↗
          </button>
        </div>

        {/* Linha 2: Nav horizontal */}
        <nav className="max-w-[1600px] mx-auto px-8 border-t border-wire/50 flex items-center gap-0 overflow-x-auto whitespace-nowrap">
          {nav.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `group relative px-4 py-3 font-mono text-[12px] uppercase tracking-[0.22em] transition-colors shrink-0 ${
                  isActive ? 'text-paper' : 'text-dust hover:text-paper'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="text-wire mr-2 text-[10px]">{n.code}</span>
                  {n.label}
                  {isActive && <span className="absolute left-4 right-4 bottom-0 h-[2px] bg-onair"></span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      <Marquee />

      <main className="max-w-[1600px] mx-auto px-8 py-10">{children}</main>

      <footer className="border-t border-wire mt-24">
        <div className="max-w-[1600px] mx-auto px-8 py-6 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-dust">
          <span>© Live Universe · Control Room v0.1</span>
          <span>Edição {loc.pathname} · Broadcast Editorial</span>
          <span>Built in São Paulo</span>
        </div>
      </footer>
    </div>
  )
}
