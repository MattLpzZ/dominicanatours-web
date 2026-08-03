import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página no encontrada | Dominicana Tour',
  robots: { index: false },
}

const POPULAR = [
  { slug: 'isla-saona-en-catamaran',            name: 'Isla Saona en Catamarán' },
  { slug: '27-charcos-de-damajagua',            name: '27 Charcos de Damajagua' },
  { slug: 'avistamiento-de-ballenas-jorobadas', name: 'Avistamiento de Ballenas' },
]

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dt-bg flex flex-col">
      {/* Minimal nav */}
      <header className="border-b border-dt-border px-6 h-14 flex items-center">
        <Link href="/" className="font-display font-black text-dt-text text-lg tracking-tight">
          Dominicana<span className="text-accent">Tour</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">

          {/* 404 visual */}
          <div className="relative inline-block mb-8">
            <p className="font-display font-black text-[120px] sm:text-[160px] leading-none text-dt-border select-none">
              404
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-accent/10 border border-accent/20 rounded-2xl px-5 py-2.5">
                <p className="text-accent font-bold text-sm tracking-wider uppercase">Página no encontrada</p>
              </div>
            </div>
          </div>

          <h1 className="font-display font-bold text-dt-text text-2xl sm:text-3xl mb-3">
            Esta excursión no existe
          </h1>
          <p className="text-dt-text-2 text-base mb-8 max-w-sm mx-auto">
            La página que buscas fue movida, eliminada o nunca existió.
            Pero tenemos más de 20 excursiones esperándote.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link
              href="/excursiones"
              className="inline-flex items-center justify-center gap-2 bg-accent text-white font-bold px-6 py-3 rounded-xl hover:bg-accent/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
              Ver todas las excursiones
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 border border-dt-border text-dt-text-2 font-semibold px-6 py-3 rounded-xl hover:bg-dt-surface transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              Inicio
            </Link>
          </div>

          {/* Popular tours */}
          <div>
            <p className="text-dt-text-3 text-xs font-bold uppercase tracking-widest mb-3">Tours populares</p>
            <div className="flex flex-col gap-2">
              {POPULAR.map(t => (
                <Link
                  key={t.slug}
                  href={`/excursiones/${t.slug}`}
                  className="flex items-center justify-between px-4 py-3 bg-dt-surface border border-dt-border rounded-xl hover:border-accent/50 hover:bg-dt-bg-2 transition-all group"
                >
                  <span className="text-dt-text-2 text-sm group-hover:text-dt-text transition-colors">{t.name}</span>
                  <svg className="w-4 h-4 text-dt-border group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer strip */}
      <footer className="border-t border-dt-border px-6 py-4 text-center">
        <p className="text-dt-text-3 text-xs">
          ¿Necesitas ayuda?{' '}
          <a href="https://wa.me/18095550100" target="_blank" rel="noopener noreferrer"
             className="text-accent hover:underline">Escríbenos por WhatsApp</a>
        </p>
      </footer>
    </div>
  )
}
