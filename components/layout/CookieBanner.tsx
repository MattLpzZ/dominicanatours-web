'use client'
import { useState, useEffect } from 'react'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('dt-cookie-consent')
    if (!consent) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem('dt-cookie-consent', 'all')
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied' })
    }
    setVisible(false)
  }

  function decline() {
    localStorage.setItem('dt-cookie-consent', 'essential')
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied' })
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-[#111] text-white border-t border-white/10 px-4 py-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed text-white/80">
            Usamos cookies para analíticas (Google Analytics) y mejorar tu experiencia.{' '}
            <a href="/privacidad" className="text-accent hover:underline">Política de privacidad</a>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            className="text-[13px] font-semibold px-4 py-2 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
          >
            Solo esenciales
          </button>
          <button
            onClick={accept}
            className="text-[13px] font-bold px-5 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-all"
          >
            Aceptar todo
          </button>
        </div>
      </div>
    </div>
  )
}
