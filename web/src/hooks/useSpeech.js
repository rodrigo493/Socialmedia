import { useEffect, useRef, useState } from 'react'

// Web Speech API wrapper — funciona em Chrome/Edge nativo, sem custo.
// Devolve { supported, listening, transcript, start, stop }.
export function useSpeech({ lang = 'pt-BR', onFinal } = {}) {
  const Rec = typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition : null
  const supported = !!Rec
  const recRef = useRef(null)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')

  useEffect(() => {
    if (!supported) return
    const r = new Rec()
    r.lang = lang
    r.continuous = false
    r.interimResults = true
    r.onresult = (e) => {
      let interim = '', final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t; else interim += t
      }
      setTranscript(final || interim)
      if (final && onFinal) onFinal(final.trim())
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    recRef.current = r
  }, [supported, lang])

  const start = () => {
    if (!recRef.current) return
    setTranscript('')
    try { recRef.current.start(); setListening(true) } catch {}
  }
  const stop = () => { try { recRef.current?.stop() } catch {}; setListening(false) }

  return { supported, listening, transcript, start, stop }
}
