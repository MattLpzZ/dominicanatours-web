'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <section className="dt-sec flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
        </div>
        <h2 className="text-xl font-display font-bold text-dt-text mb-2">Algo salió mal</h2>
        <p className="text-sm text-dt-text-3 mb-6 leading-relaxed">
          No pudimos cargar el contenido. Puede ser un problema temporal con nuestra conexión.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg border border-dt-border text-sm font-semibold text-dt-text-2 hover:bg-dt-bg-2 transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </section>
  )
}
