"use client"
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

function Ico({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={['w-4 h-4 shrink-0', className].filter(Boolean).join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const PAGE_META: Record<string, { title: string; sub: string; icon: string }> = {
  '/admin':               { title: 'Dashboard',       sub: 'Resumen general del sistema',    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  '/admin/reservas':      { title: 'Reservas',        sub: 'Gestion de reservas',            icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  '/admin/tours':         { title: 'Tours',           sub: 'Catalogo de excursiones',        icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  '/admin/soporte':       { title: 'Soporte',         sub: 'Mensajes y consultas',           icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  '/admin/reportes':      { title: 'Reportes',        sub: 'Metricas y rendimiento',         icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  '/admin/usuarios':      { title: 'Usuarios',        sub: 'Equipo y accesos',               icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  '/admin/ofertas':       { title: 'Ofertas',         sub: 'Descuentos y promociones',       icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
  '/admin/cupones':       { title: 'Cupones',         sub: 'Codigos de descuento',           icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
  '/admin/personalizacion': { title: 'Personalizacion', sub: 'Tema y apariencia del sitio', icon: 'M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z' },
  '/admin/configuracion': { title: 'Configuracion',   sub: 'Ajustes del sitio',             icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
}

const SUN  = 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z'
const MOON = 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z'

export default function AdminHeader() {
  const path = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => setMounted(true), [])

  const key = Object.keys(PAGE_META)
    .filter(k => k !== '/admin')
    .find(k => path.startsWith(k)) ?? '/admin'
  const meta = PAGE_META[key] ?? PAGE_META['/admin']

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-5 bg-dt-bg border-b border-dt-border">

      {/* Left: icon + title + sub */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-accent/10 flex items-center justify-center">
          <Ico d={meta.icon} className="w-3.5 h-3.5 text-accent" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-dt-text leading-tight">{meta.title}</h1>
          <p className="text-[10px] text-dt-text-3 leading-tight">{meta.sub}</p>
        </div>
      </div>

      {/* Right: AYUDA + toggle + avatar */}
      <div className="flex items-center gap-1">

        {/* Help button */}
        <div className="relative">
          <button
            onClick={() => setShowHelp(v => !v)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-dt-text-3 hover:text-dt-text px-2.5 py-1.5 rounded-md hover:bg-dt-bg-2 transition-colors"
          >
            <Ico d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-3.5 h-3.5" />
            AYUDA
          </button>
          {showHelp && (
            <div className="absolute right-0 top-11 w-72 bg-dt-surface border border-dt-border rounded-xl shadow-dt-md p-4 z-50">
              <p className="text-sm font-semibold text-dt-text mb-1.5">Ayuda</p>
              <p className="text-xs text-dt-text-3 leading-relaxed">
                Panel de administracion de Dominicana Tour. Para soporte tecnico contacta a{' '}
                <a href="https://soymattlpzz.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">soymattlpzz</a>.
              </p>
              <button onClick={() => setShowHelp(false)} className="mt-3 text-xs text-accent hover:underline">Cerrar</button>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 flex items-center justify-center rounded-md text-dt-text-3 hover:bg-dt-bg-2 hover:text-dt-text transition-colors"
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            <Ico d={theme === 'dark' ? SUN : MOON} className="w-4 h-4" />
          </button>
        )}

      </div>
    </header>
  )
}
