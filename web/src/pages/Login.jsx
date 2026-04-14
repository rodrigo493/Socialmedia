import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../lib/auth'

export default function Login() {
  const nav = useNavigate()
  const [mode, setMode] = useState('loading') // loading | login | setup
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/v1/auth/status').then(r => r.json()).then(d => {
      setMode(d.configured ? 'login' : 'setup')
    }).catch(() => setMode('login'))
  }, [])

  async function submit() {
    setErr(null); setBusy(true)
    try {
      if (mode === 'setup') {
        if (password !== password2) throw new Error('senhas não conferem')
        const r = await fetch('/api/v1/auth/setup', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'erro')
        setToken(data.token)
        nav('/')
      } else {
        const r = await fetch('/api/v1/auth/login', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'erro')
        setToken(data.token)
        nav('/')
      }
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen grain scanlines relative bg-ink flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <span className="onair-dot w-3 h-3 rounded-full bg-onair" />
          <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-onair">ON AIR</span>
          <span className="font-display text-3xl italic font-light text-paper ml-2">
            Live<span className="font-medium">Universe</span>
          </span>
        </div>

        <div className="bg-coal border border-wire p-8 bracketed text-paper">
          <span className="br-tl" /><span className="br-tr" /><span className="br-bl" /><span className="br-br" />

          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-onair mb-2">
            {mode === 'setup' ? 'Setup inicial' : 'Acesso restrito'}
          </div>
          <h1 className="font-display italic text-4xl text-paper mb-6">
            {mode === 'setup' ? 'Crie a conta admin' : 'Entre no painel'}
          </h1>

          {mode === 'loading' ? (
            <div className="py-12 text-center font-display italic text-xl text-dust">verificando…</div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); submit() }} className="space-y-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-1">Usuário</label>
                <input value={username} onChange={e => setUsername(e.target.value)} autoFocus
                  className="w-full bg-ink border border-wire text-paper p-3 focus:outline-none focus:border-paper font-sans" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-1">Senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-ink border border-wire text-paper p-3 focus:outline-none focus:border-paper font-mono" />
              </div>
              {mode === 'setup' && (
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-dust block mb-1">Confirmar senha</label>
                  <input type="password" value={password2} onChange={e => setPassword2(e.target.value)}
                    className="w-full bg-ink border border-wire text-paper p-3 focus:outline-none focus:border-paper font-mono" />
                </div>
              )}

              {err && <div className="font-mono text-[11px] text-onair border border-onair/60 p-2">{err}</div>}

              <button type="submit" disabled={busy || !username || !password}
                className="w-full font-mono text-[11px] uppercase tracking-[0.25em] text-paper bg-onair border border-onair py-4 hover:bg-[#C9241E] disabled:opacity-40">
                {busy ? '…' : mode === 'setup' ? 'Criar conta →' : 'Entrar →'}
              </button>

              {mode === 'setup' && (
                <div className="font-mono text-[10px] text-dust mt-3 leading-relaxed">
                  Primeiro acesso: defina o usuário admin. Essa conta vai controlar o painel inteiro (postar, gerar, aprovar). Senha mínima: 8 caracteres.
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
