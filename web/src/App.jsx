import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import Inbox from './pages/Inbox'
import Detail from './pages/Detail'
import History from './pages/History'
import Agents from './pages/Agents'
import Report from './pages/Report'
import Chat from './pages/Chat'
import Criados from './pages/Criados'
import Products from './pages/Products'
import Library from './pages/Library'
import Agenda from './pages/Agenda'
import Brand from './pages/Brand'
import Downloads from './pages/Downloads'
import HeyGen from './pages/HeyGen'
import Analytics from './pages/Analytics'
import InstagramOS from './pages/InstagramOS'
import Login from './pages/Login'
import { getToken } from './lib/auth'

function Guard({ children }) {
  const [checked, setChecked] = useState(false)
  const [ok, setOk] = useState(false)
  const nav = useNavigate()
  const loc = useLocation()

  useEffect(() => {
    const t = getToken()
    if (!t) { setChecked(true); setOk(false); nav('/login'); return }
    fetch('/api/v1/auth/me').then(r => {
      if (r.ok) { setOk(true) } else { setOk(false); nav('/login') }
      setChecked(true)
    }).catch(() => { setOk(false); nav('/login'); setChecked(true) })
  }, [loc.pathname])

  if (!checked) return <div className="min-h-screen bg-ink flex items-center justify-center font-display italic text-2xl text-dust">…</div>
  if (!ok) return null
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <Guard>
          <Layout>
            <Routes>
              <Route path="/" element={<Inbox />} />
              <Route path="/material/:id" element={<Detail />} />
              <Route path="/historico" element={<History />} />
              <Route path="/agentes" element={<Agents />} />
              <Route path="/relatorio" element={<Report />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/criados" element={<Criados />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/biblioteca" element={<Library />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/marca" element={<Brand />} />
              <Route path="/downloads" element={<Downloads />} />
              <Route path="/heygen" element={<HeyGen />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/instagram-os" element={<InstagramOS />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Guard>
      } />
    </Routes>
  )
}
