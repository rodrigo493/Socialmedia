import { networks } from '../data/mock'

export default function NetworkSelector({ value = [], onChange, allowed }) {
  const list = allowed ? networks.filter(n => allowed.includes(n.id)) : networks
  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter(v => v !== id))
    else onChange([...value, id])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {list.map(n => {
        const active = value.includes(n.id)
        return (
          <button
            key={n.id}
            onClick={() => toggle(n.id)}
            className={`group relative px-4 py-2.5 border font-mono text-[11px] uppercase tracking-[0.22em] transition-all
              ${active
                ? 'border-paper bg-paper text-ink'
                : 'border-wire text-dust hover:border-paper hover:text-paper'
              }`}
          >
            <span className="flex items-center gap-2.5">
              <span
                className={`w-1.5 h-1.5 rounded-full transition-all ${active ? '' : 'opacity-40'}`}
                style={{ background: active ? n.color : n.color }}
              />
              {n.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
