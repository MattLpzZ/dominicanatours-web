'use client'
import { useState, useEffect } from 'react'

const COOKIE_NAME = 'dt-consent'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

function getConsent(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setConsent(value: 'all' | 'essential') {
  document.cookie = `${COOKIE_NAME}=${value}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`
}

const TEXT = {
  es: {
    title: 'Usamos cookies',
    body: 'Para ofrecerte la mejor experiencia, usamos cookies esenciales (necesarias para que el sitio funcione) y, con tu permiso, cookies de análisis para entender cómo se usa el sitio.',
    details: 'Ver categorías',
    hide: 'Ocultar',
    privacy: 'Política de privacidad',
    essential: 'Solo esenciales',
    accept: 'Aceptar todo',
    cats: [
      {
        name: 'Esenciales',
        always: true,
        desc: 'Necesarias para que el sitio funcione: sesión de usuario, carrito, preferencia de idioma y este aviso de cookies.',
        examples: 'next-auth.session-token, dt-consent',
      },
      {
        name: 'Analítica',
        always: false,
        desc: 'Nos ayudan a entender cómo interactúas con el sitio para mejorar contenidos y experiencia.',
        examples: 'Google Analytics (_ga, _gid) — pendiente de activación',
      },
    ],
  },
  en: {
    title: 'We use cookies',
    body: 'To give you the best experience, we use essential cookies (required for the site to work) and, with your permission, analytics cookies to understand how the site is used.',
    details: 'See categories',
    hide: 'Hide',
    privacy: 'Privacy policy',
    essential: 'Essential only',
    accept: 'Accept all',
    cats: [
      {
        name: 'Essential',
        always: true,
        desc: 'Required for the site to function: user session, cart, language preference and this cookie notice.',
        examples: 'next-auth.session-token, dt-consent',
      },
      {
        name: 'Analytics',
        always: false,
        desc: 'Help us understand how you interact with the site so we can improve content and experience.',
        examples: 'Google Analytics (_ga, _gid) — pending activation',
      },
    ],
  },
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [open, setOpen] = useState(false)
  const [locale, setLocale] = useState<'es' | 'en'>('es')

  useEffect(() => {
    const isEn = window.location.pathname.startsWith('/en')
    setLocale(isEn ? 'en' : 'es')
    if (!getConsent()) setVisible(true)
  }, [])

  function accept() {
    setConsent('all')
    setVisible(false)
  }

  function decline() {
    setConsent('essential')
    setVisible(false)
  }

  if (!visible) return null

  const t = TEXT[locale]
  const privacyHref = locale === 'en' ? '/en/privacidad' : '/privacidad'

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-white/10"
      style={{ background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-5xl mx-auto px-4 py-4 sm:py-5">

        {/* Main row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon + text */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-white mb-0.5">{t.title}</p>
              <p className="text-[12px] leading-relaxed text-white/55">
                {t.body}{' '}
                <a href={privacyHref} className="text-accent hover:underline">{t.privacy}</a>
              </p>
              <button
                onClick={() => setOpen(v => !v)}
                className="text-[11px] text-white/40 hover:text-white/70 mt-1 underline underline-offset-2 transition-colors"
              >
                {open ? t.hide : t.details}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              onClick={decline}
              className="text-[13px] font-semibold px-4 py-2 rounded-lg border border-white/15 text-white/55 hover:text-white hover:border-white/35 transition-all"
            >
              {t.essential}
            </button>
            <button
              onClick={accept}
              className="text-[13px] font-bold px-5 py-2 rounded-lg bg-accent text-white hover:bg-accent/85 transition-all"
            >
              {t.accept}
            </button>
          </div>
        </div>

        {/* Details panel */}
        {open && (
          <div className="mt-4 pt-4 border-t border-white/8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {t.cats.map(cat => (
              <div key={cat.name} className="bg-white/4 rounded-xl p-3 flex gap-3">
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-white">{cat.name}</span>
                    {cat.always
                      ? <span className="text-[10px] px-1.5 py-px rounded bg-white/10 text-white/40 font-medium">Siempre activas</span>
                      : <span className="text-[10px] px-1.5 py-px rounded bg-accent/20 text-accent font-medium">Opcionales</span>
                    }
                  </div>
                  <p className="text-[11px] text-white/45 leading-relaxed mt-1">{cat.desc}</p>
                  <p className="text-[10px] text-white/25 font-mono mt-1">{cat.examples}</p>
                </div>
                <div className="shrink-0">
                  {cat.always ? (
                    <div className="w-8 h-4 rounded-full bg-accent/40 flex items-center justify-end pr-0.5 cursor-not-allowed">
                      <div className="w-3 h-3 rounded-full bg-white/60" />
                    </div>
                  ) : (
                    <div className="w-8 h-4 rounded-full bg-accent flex items-center justify-end pr-0.5">
                      <div className="w-3 h-3 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
