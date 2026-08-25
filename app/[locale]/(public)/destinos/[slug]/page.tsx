import { fetchApi } from '@/lib/api'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ParallaxHero } from '@/components/tour/ParallaxHero'
import { DestinoToursClient } from '@/components/destino/DestinoToursClient'
import type { Metadata } from 'next'

export const revalidate = 300

interface Tour {
  id: number; slug: string; name: string; subtitle?: string | null
  price_adult: number; duration?: string | null; featured: boolean; coming_soon: boolean
  cover_image?: string | null; category?: { name: string; icon?: string | null }
  avg_rating?: number | null; review_count?: number
}
interface Accommodation {
  id: number; slug: string; name: string; type: string; stars?: number
  price_min?: number; cover_image?: string | null; short_description?: string | null
}
interface Destination {
  id: number; name: string; slug: string; region: string
  cover_image?: string | null; description?: string | null; tours_count: number
}
interface ApiResponse {
  destination: Destination
  tours: Tour[]
  accommodations: Accommodation[]
}

interface Props { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const data = await fetchApi<ApiResponse>(`/destinations/${slug}`)
    const d = data.destination
    return {
      title: `Tours en ${d.name} — Dominicana Tour`,
      description: d.description || `Descubre las mejores excursiones en ${d.name}, República Dominicana.`,
      openGraph: {
        title: `Tours en ${d.name}`,
        description: d.description || `Excursiones en ${d.name}`,
        images: d.cover_image ? [{ url: d.cover_image }] : [],
      },
    }
  } catch { return { title: 'Destino — Dominicana Tour' } }
}

export default async function DestinoPage({ params }: Props) {
  const { slug } = await params
  let data: ApiResponse
  try {
    data = await fetchApi<ApiResponse>(`/destinations/${slug}`)
  } catch { notFound() }

  const { destination, tours, accommodations } = data
  const activeToursCount = tours.filter(t => !t.coming_soon).length
  const comingSoonCount = tours.length - activeToursCount

  return (
    <>
      {/* ── PARALLAX HERO ── */}
      <div className="relative w-full overflow-hidden" style={{ height: 'min(52vw, 480px)', minHeight: 280 }}>
        {destination.cover_image ? (
          <ParallaxHero src={destination.cover_image} alt={destination.name} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-sky-900 to-sky-700" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        {/* Back link */}
        <Link
          href="/destinos"
          className="absolute top-5 left-5 z-20 flex items-center gap-1.5 text-white/80 hover:text-white text-[13px] font-medium transition-colors backdrop-blur-sm bg-black/20 px-3 py-1.5 rounded-full"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Destinos
        </Link>
        {/* Text content */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 sm:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60 mb-2">{destination.region}</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-3" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.4)' }}>
            {destination.name}
          </h1>
          {destination.description && (
            <p className="text-white/80 text-[15px] max-w-xl leading-relaxed mb-4">{destination.description}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1.5 text-white/75 text-sm bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
              {tours.length} {tours.length === 1 ? 'tour' : 'tours'}
            </span>
            {activeToursCount > 0 && (
              <span className="flex items-center gap-1.5 text-white/75 text-sm bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <svg className="w-3.5 h-3.5 fill-accent" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="10"/>
                </svg>
                {activeToursCount} disponibles
              </span>
            )}
            {accommodations.length > 0 && (
              <span className="flex items-center gap-1.5 text-white/75 text-sm bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                {accommodations.length} {accommodations.length === 1 ? 'alojamiento' : 'alojamientos'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 space-y-14">

        {/* Tours section with search */}
        <section>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dt-text-3 mb-1">Excursiones</p>
              <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-dt-text">Tours en {destination.name}</h2>
            </div>
            <Link href={`/excursiones?zone=${encodeURIComponent(destination.name)}`} className="text-[13px] font-semibold text-accent hover:opacity-75 transition-opacity whitespace-nowrap hidden sm:block">
              Ver en catálogo →
            </Link>
          </div>
          <DestinoToursClient tours={tours} city={destination.name} />
        </section>

        {/* Accommodations */}
        {accommodations.length > 0 && (
          <section>
            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dt-text-3 mb-1">Alojamiento</p>
              <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-dt-text">Dónde quedarse en {destination.name}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {accommodations.map(acc => (
                <Link key={acc.id} href={`/alojamientos/${acc.slug}`} className="group flex flex-col rounded-xl border border-dt-border bg-dt-surface overflow-hidden hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-lg transition-all">
                  <div className="relative h-44 bg-dt-bg-2 overflow-hidden">
                    {acc.cover_image ? (
                      <img src={acc.cover_image} alt={acc.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-900/30 to-amber-700/20 flex items-center justify-center">
                        <svg className="w-12 h-12 text-amber-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="font-bold text-dt-text text-[15px] mb-0.5">{acc.name}</p>
                    <p className="text-[11px] text-dt-text-3 capitalize mb-2">{acc.type}{acc.stars ? ` · ${'★'.repeat(acc.stars)}` : ''}</p>
                    {acc.short_description && <p className="text-[12px] text-dt-text-2 line-clamp-2 flex-1">{acc.short_description}</p>}
                    {acc.price_min && (
                      <p className="text-sm font-bold text-accent mt-3">Desde ${acc.price_min}/noche</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {tours.length === 0 && accommodations.length === 0 && (
          <div className="text-center py-20">
            <p className="text-dt-text-3 text-lg mb-4">Próximamente tours y alojamientos en {destination.name}</p>
            <Link href="/excursiones" className="inline-block text-accent font-semibold hover:opacity-75 transition-opacity">Ver todos los tours →</Link>
          </div>
        )}
      </div>
    </>
  )
}
