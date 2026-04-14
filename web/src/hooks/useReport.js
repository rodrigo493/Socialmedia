import { useEffect, useState } from 'react'
import { report as fallback } from '../data/report'

const API = import.meta.env.VITE_API_URL || ''

export function useReport() {
  const [state, setState] = useState({ loading: true, data: null, error: null, source: null })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`${API}/api/v1/reports/latest`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `HTTP ${res.status}`)
        }
        const data = await res.json()
        if (!cancelled) setState({ loading: false, data, error: null, source: 'api' })
      } catch (err) {
        if (!cancelled) setState({ loading: false, data: fallback, error: err.message, source: 'fallback' })
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return state
}
