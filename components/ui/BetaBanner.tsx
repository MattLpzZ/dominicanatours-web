'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const KEY = 'dt_beta_dismissed'

export default function BetaBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true)
    } catch {}
  }, [])

  if (!visible) return null

  function dismiss() {
    try { localStorage.setItem(KEY, '1') } catch {}
    setVisible(false)
  }

  return (
    <div
      role="alert"
      className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-between gap-4 px-4 py-3 text-white"
      style={{ background: 'linear-gradient(90deg,#1d5fa0 0%,#1d70b7 100%)', boxShadow: '0 -2px 12px rgba(0,0,0,.15)' }}
    >
      <p className="text-sm leading-snug text-center flex-1">
        <span className="font-semibold">Sitio en fase de pruebas.</span>{' '}
        Si encuentras algún error o inconveniente, por favor escríbenos a{' '}
        <a
          href="mailto:it@dominicanatour.com"
          className="underline underline-offset-2 font-medium hover:text-blue-200 transition-colors"
        >
          it@dominicanatour.com
        </a>
        {' '}— ¡te lo agradecemos mucho!
      </p>
      <button
        onClick={dismiss}
        aria-label="Cerrar aviso"
        className="shrink-0 rounded-full p-1 hover:bg-white/20 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}
