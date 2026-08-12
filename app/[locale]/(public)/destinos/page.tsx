import { fetchApi } from '@/lib/api'
import { Link } from '@/i18n/navigation'
import type { Metadata } from 'next'

interface Destination {
  id: number
  name: string
  slug: string
  region?: string
  cover_image?: string
  description?: string
  featured: boolean
  tours_count: number
  accommodations_count: number
}

export const metadata: Metadata = {
  title: 'Destinos en Republica Dominicana — Dominicana Tour',
  description: 'Explora los mejores destinos de la Republica Dominicana: playas, montanas, ciudades historicas y mas.',
}

export default async function DestinosPage() {
  let destinations: Destination[] = []
  try {
    const res = await fetchApi<{ destinations: Destination[] }>('/destinations')
    destinations = res.destinations ?? []
  } catch { destinations = [] }

  const featured = destinations.filter(d => d.featured)
  const rest     = destinations.filter(d => !d.featured)

  return (
    <div>
      {/* Hero */}
      <div className="bg-dt-dark pt-28 pb-14 px-4 text-center mb-10">
        <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3">Explora la isla</p>
        <h1 className="font-display font-bold text-white text-4xl sm:text-5xl mb-4">Destinos</h1>
        <p className="text-white/45 max-w-md mx-auto text-base">
          Descubre las provincias y zonas mas bellas de la Republica Dominicana.
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-20 space-y-12">

        {destinations.length === 0 && (
          <div className="text-center py-20">
            <p className="text-dt-text-3 text-lg">Proximamente destinos disponibles.</p>
          </div>
        )}

        {featured.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-dt-text mb-6">Destinos destacados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map(d => <DestCard key={d.id} dest={d} large />)}
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section>
            {featured.length > 0 && <h2 className="text-xl font-bold text-dt-text mb-6">Mas destinos</h2>}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {rest.map(d => <DestCard key={d.id} dest={d} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function DestCard({ dest, large = false }: { dest: Destination; large?: boolean }) {
  return (
    <Link
      href={`/destinos/${dest.slug}`}
      className={`group block rounded-2xl border border-dt-border bg-dt-bg-2 overflow-hidden hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300`}
    >
      <div className={`relative ${large ? 'h-52' : 'h-36'} bg-dt-bg-2 overflow-hidden`}>
        {dest.cover_image ? (
          <img
            src={dest.cover_image}
            alt={dest.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sky-900/50 to-sky-700/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-sky-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className={`font-bold text-white ${large ? 'text-xl' : 'text-base'} leading-tight`}>{dest.name}</h3>
          {dest.region && <p className="text-white/50 text-[11px] mt-0.5">{dest.region}</p>}
        </div>
      </div>
      <div className="px-4 py-3 flex items-center gap-3 text-[11px] text-dt-text-3">
        {dest.tours_count > 0 && (
          <span>{dest.tours_count} {dest.tours_count === 1 ? 'tour' : 'tours'}</span>
        )}
        {dest.tours_count > 0 && dest.accommodations_count > 0 && <span>·</span>}
        {dest.accommodations_count > 0 && (
          <span>{dest.accommodations_count} {dest.accommodations_count === 1 ? 'alojamiento' : 'alojamientos'}</span>
        )}
      </div>
    </Link>
  )
}
