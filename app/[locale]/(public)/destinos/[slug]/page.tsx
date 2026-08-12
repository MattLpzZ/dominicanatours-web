import { fetchApi } from '@/lib/api'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ParallaxHero } from '@/components/tour/ParallaxHero'
import type { Metadata } from 'next'

interface Tour {
  id: number; slug: string; name: string; subtitle?: string
  price_adult: number; duration?: string; featured: boolean; coming_soon: boolean
  cover_image?: string
  category?: { name: string; icon?: string }
}
interface Accommodation {
  id: number; slug: string; name: string; type: string; stars?: number
  price_min?: number; cover_image?: string; short_description?: string
}
interface Destination {
  id: number; name: string; slug: string; region: string
  cover_image?: string; description?: string; tours_count: number
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
    return { title: `${data.destination.name} — Dominicana Tour`, description: data.destination.description || `Tours y alojamientos en ${data.destination.name}` }
  } catch { return { title: 'Destino — Dominicana Tour' } }
}

export default async function DestinoPage({ params }: Props) {
  const { slug } = await params
  let data: ApiResponse
  try {
    data = await fetchApi<ApiResponse>(`/destinations/${slug}`)
  } catch { notFound() }

  const { destination, tours, accommodations } = data

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 space-y-12">

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden min-h-[260px] flex items-end" style={{ height: 'min(40vw, 380px)', minHeight: 220 }}>
        {destination.cover_image ? (
          <ParallaxHero src={destination.cover_image} alt={destination.name} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-sky-800 to-sky-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="relative z-10 p-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-1">{destination.region}</p>
          <h1 className="text-3xl font-bold text-white mb-2">{destination.name}</h1>
          {destination.description && (
            <p className="text-white/80 text-sm max-w-xl">{destination.description}</p>
          )}
          <div className="flex gap-4 mt-3 text-white/70 text-sm">
            <span>{tours.length} {tours.length === 1 ? 'tour' : 'tours'}</span>
            <span>·</span>
            <span>{accommodations.length} {accommodations.length === 1 ? 'alojamiento' : 'alojamientos'}</span>
          </div>
        </div>
      </div>

      {/* Tours */}
      {tours.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-dt-text mb-6">Tours en {destination.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {tours.map(tour => (
              <Link key={tour.id} href={`/excursiones/${tour.slug}`} className="group block rounded-2xl border border-dt-border bg-dt-bg-2 overflow-hidden hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-lg transition-all">
                <div className="relative aspect-video bg-dt-bg-2">
                  {tour.cover_image
                    ? <img src={tour.cover_image} alt={tour.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-sky-900/40 to-sky-700/20" />
                  }
                  {tour.coming_soon && (
                    <div className="absolute inset-0 bg-black/50 flex items-end pb-3 justify-center">
                      <span className="bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Muy pronto</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-dt-text text-sm line-clamp-2 leading-snug">{tour.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    {tour.duration && <span className="text-[11px] text-dt-text-3">{tour.duration}</span>}
                    {!tour.coming_soon && tour.price_adult > 0 && (
                      <span className="text-sm font-bold text-accent">${tour.price_adult}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Accommodations */}
      {accommodations.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-dt-text mb-6">Alojamientos en {destination.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {accommodations.map(acc => (
              <div key={acc.id} className="rounded-2xl border border-dt-border bg-dt-bg-2 overflow-hidden">
                <div className="relative h-40 bg-dt-bg-2">
                  {acc.cover_image
                    ? <img src={acc.cover_image} alt={acc.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-amber-900/30 to-amber-700/20 flex items-center justify-center text-dt-text-3 text-4xl">🏨</div>
                  }
                </div>
                <div className="p-4">
                  <p className="font-semibold text-dt-text">{acc.name}</p>
                  <p className="text-[11px] text-dt-text-3 mt-0.5 capitalize">{acc.type}{acc.stars ? ` · ${'★'.repeat(acc.stars)}` : ''}</p>
                  {acc.short_description && <p className="text-[12px] text-dt-text-2 mt-2 line-clamp-2">{acc.short_description}</p>}
                  {acc.price_min && <p className="text-sm font-bold text-accent mt-2">Desde ${acc.price_min}/noche</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tours.length === 0 && accommodations.length === 0 && (
        <div className="text-center py-20">
          <p className="text-dt-text-3 text-lg">Próximamente tours y alojamientos en {destination.name}</p>
          <Link href="/excursiones" className="mt-4 inline-block text-accent font-semibold hover:opacity-75 transition-opacity">Ver todos los tours →</Link>
        </div>
      )}
    </div>
  )
}
