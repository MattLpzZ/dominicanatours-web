import { fetchApi } from '@/lib/api'
import type { Metadata } from 'next'

interface Accommodation {
  id: number
  slug: string
  name: string
  type: string
  short_description?: string
  description?: string
  stars?: number
  price_min?: number
  price_max?: number
  cover_image?: string
  province?: string
  featured: boolean
  booking_url?: string
  website?: string
}

export const metadata: Metadata = {
  title: 'Alojamientos en Republica Dominicana — Dominicana Tour',
  description: 'Hoteles, resorts, villas y apartamentos en los mejores destinos de la Republica Dominicana.',
}

export default async function AlojamientosPage() {
  let accommodations: Accommodation[] = []
  try {
    const res = await fetchApi<{ data: Accommodation[]; total: number }>('/v3/accommodations?limit=100')
    accommodations = res.data ?? []
  } catch { accommodations = [] }

  const featured  = accommodations.filter(a => a.featured)
  const rest      = accommodations.filter(a => !a.featured)

  return (
    <div>
      {/* Hero */}
      <div className="bg-dt-dark pt-28 pb-14 px-4 text-center mb-10">
        <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3">Donde quedarse</p>
        <h1 className="font-display font-bold text-white text-4xl sm:text-5xl mb-4">Alojamientos</h1>
        <p className="text-white/45 max-w-md mx-auto text-base">
          Los mejores hoteles, resorts y villas seleccionados cerca de nuestros tours.
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-20 space-y-12">

        {accommodations.length === 0 && (
          <div className="text-center py-20">
            <p className="text-dt-text-3 text-lg">Proximamente alojamientos disponibles.</p>
          </div>
        )}

        {featured.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-dt-text mb-6">Destacados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map(acc => <AccCard key={acc.id} acc={acc} />)}
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section>
            {featured.length > 0 && <h2 className="text-xl font-bold text-dt-text mb-6">Todos los alojamientos</h2>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {rest.map(acc => <AccCard key={acc.id} acc={acc} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function AccCard({ acc }: { acc: Accommodation }) {
  return (
    <div className="rounded-2xl border border-dt-border bg-dt-bg-2 overflow-hidden group hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300">
      <div className="relative h-48 bg-dt-bg-2 overflow-hidden">
        {acc.cover_image ? (
          <img
            src={acc.cover_image}
            alt={acc.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-900/30 to-amber-700/20 flex items-center justify-center">
            <svg className="w-12 h-12 text-dt-text-3/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        {acc.featured && (
          <div className="absolute top-3 left-3 bg-accent text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Destacado
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-dt-text leading-snug">{acc.name}</p>
          {acc.stars && <span className="text-amber-400 text-xs shrink-0">{'★'.repeat(acc.stars)}</span>}
        </div>
        <p className="text-[11px] text-dt-text-3 capitalize mb-2">
          {acc.type.toLowerCase()}{acc.province ? ` · ${acc.province}` : ''}
        </p>
        {acc.short_description && (
          <p className="text-[12px] text-dt-text-2 line-clamp-2 mb-3">{acc.short_description}</p>
        )}
        <div className="flex items-center justify-between mt-auto">
          {acc.price_min ? (
            <p className="text-sm font-bold text-accent">
              Desde ${acc.price_min}<span className="font-normal text-dt-text-3">/noche</span>
            </p>
          ) : (
            <span className="text-xs text-dt-text-3">Consultar precio</span>
          )}
          {(acc.booking_url || acc.website) && (
            <a
              href={acc.booking_url ?? acc.website ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-accent border border-accent/30 bg-accent/5 hover:bg-accent/15 px-3 py-1.5 rounded-lg transition-colors"
            >
              Ver mas
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
