export const revalidate = 60
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchApi } from '@/lib/api'
import { ParallaxHero } from '@/components/tour/ParallaxHero'
import { AccommodationReviewModal } from '@/components/review/AccommodationReviewModal'
import { CopyLinkButton } from '@/components/tour/CopyLinkButton'
import type { Metadata } from 'next'

interface AccImage { url: string; alt?: string; sort_order?: number }
interface AccDetail {
  id: number; slug: string; name: string; type: string
  short_description?: string; description?: string
  address?: string; province?: string; stars?: number
  price_min?: number; price_max?: number
  cover_image?: string; amenities: Record<string, string> | string[]
  phone?: string; email?: string; website?: string; booking_url?: string
  featured: boolean; coming_soon: boolean
  images: AccImage[]
  avg_rating: number | null; review_count: number
}
interface ReviewStats {
  reviews: { firstName: string; country?: string; rating: number; comment?: string; createdAt: string }[]
  total: number; avg: number | null
  distribution: { r5: number; r4: number; r3: number; r12: number }
}

interface Props { params: Promise<{ locale: string; slug: string }> }

function typeLabel(t: string) {
  const m: Record<string, string> = {
    hotel: 'Hotel', resort: 'Resort', villa: 'Villa', apartment: 'Apartamento',
    hostel: 'Hostal', boutique: 'Boutique', guesthouse: 'Casa de huéspedes',
  }
  return m[t.toLowerCase()] ?? t
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const BASE = 'https://dominicanatour.com'
  try {
    const { data } = await fetchApi<{ data: AccDetail }>(`/v3/accommodations/${slug}`)
    return {
      title: `${data.name} — Dominicana Tour`,
      description: data.short_description ?? `Alojamiento en ${data.province ?? 'República Dominicana'}`,
      openGraph: {
        title: data.name,
        description: data.short_description ?? undefined,
        images: (data.cover_image || data.images?.[0]?.url)
          ? [{ url: data.cover_image ?? data.images[0].url, width: 1200, height: 630, alt: data.name }]
          : [],
      },
      alternates: { canonical: `${BASE}/alojamientos/${slug}` },
    }
  } catch { return {} }
}

export default async function AlojamientoDetailPage({ params }: Props) {
  const { slug, locale } = await params

  let acc: AccDetail
  let reviewStats: ReviewStats
  try {
    const [accRes, revRes] = await Promise.all([
      fetchApi<{ data: AccDetail }>(`/v3/accommodations/${slug}`),
      fetchApi<ReviewStats>(`/v3/accommodations/${slug}/reviews`, { cache: 'no-store' }).catch(() => null),
    ])
    acc = accRes.data
    reviewStats = revRes ?? { reviews: [], total: 0, avg: null, distribution: { r5: 0, r4: 0, r3: 0, r12: 0 } }
  } catch { notFound() }

  const heroImg = acc.cover_image ?? acc.images?.[0]?.url
  const gallery = acc.images?.filter(i => i.url !== heroImg).slice(0, 8) ?? []

  const amenities: Record<string, string> = typeof acc.amenities === 'object' && !Array.isArray(acc.amenities)
    ? acc.amenities as Record<string, string>
    : {}
  const amenityIcons: Record<string, string> = {
    pool: 'M3 4h18M3 4v.5a9 9 0 009 9 9 9 0 009-9V4M3 4H1m20 0h2M6 4v.5A6 6 0 0012 10.5 6 6 0 0018 4.5V4',
    beach: 'M21 9l-9 9M3 3l18 18M21 3L3 21m18 0H3',
    spa: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    wifi: 'M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z',
    restaurant: 'M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z',
    bar: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5',
    fitness: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    sport: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z',
  }

  return (
    <>
      {/* Hero */}
      {heroImg ? (
        <div className="relative w-full pt-[60px] sm:pt-0 overflow-hidden" style={{ height: 'min(52vw, 480px)', minHeight: 260 }}>
          <ParallaxHero src={heroImg} alt={acc.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          {acc.stars && (
            <div className="absolute top-20 right-4 sm:top-6 sm:right-6 bg-amber-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              {'★'.repeat(acc.stars)} {acc.stars} Estrellas
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-6 sm:pb-8">
            <div className="max-w-7xl mx-auto">
              <p className="text-accent text-[11px] font-bold uppercase tracking-widest mb-1">{typeLabel(acc.type)}{acc.province ? ` · ${acc.province}` : ''}</p>
              <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-white mb-1.5 leading-tight">{acc.name}</h1>
              {acc.short_description && <p className="text-white/70 text-sm sm:text-base max-w-2xl">{acc.short_description}</p>}
            </div>
          </div>
        </div>
      ) : (
        <section className="bg-dt-surface border-b border-dt-border pt-24 pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <p className="text-accent text-[11px] font-bold uppercase tracking-widest mb-2">{typeLabel(acc.type)}{acc.province ? ` · ${acc.province}` : ''}</p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-dt-text mb-2">{acc.name}</h1>
            {acc.short_description && <p className="text-dt-text-2">{acc.short_description}</p>}
          </div>
        </section>
      )}

      {/* Sticky meta bar */}
      <div className="bg-dt-surface border-b border-dt-border sticky top-[60px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm overflow-x-auto">
            <Link href="/" className="text-dt-text-3 hover:text-accent text-xs shrink-0">Inicio</Link>
            <span className="text-dt-border text-xs">/</span>
            <Link href="/alojamientos" className="text-dt-text-3 hover:text-accent text-xs shrink-0">Alojamientos</Link>
            <span className="text-dt-border text-xs">/</span>
            <span className="text-dt-text-2 text-xs font-semibold truncate max-w-[160px] sm:max-w-xs">{acc.name}</span>
            <div className="ml-auto flex items-center gap-4 shrink-0">
              {reviewStats.total > 0 && reviewStats.avg !== null && (
                <span className="text-amber-400 text-sm">★ <span className="text-dt-text-2 text-xs">{reviewStats.avg} ({reviewStats.total})</span></span>
              )}
              {acc.province && (
                <span className="hidden sm:flex items-center gap-1 text-dt-text-3 text-xs">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                  </svg>
                  {acc.province}
                </span>
              )}
              <CopyLinkButton copyLabel="Copiar enlace" copiedLabel="¡Enlace copiado!" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <section className="dt-sec">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">

            {/* Left */}
            <div className="flex flex-col gap-6 min-w-0">

              {/* Photo gallery */}
              {gallery.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-2xl overflow-hidden">
                  {gallery.slice(0, 6).map((img, i) => (
                    <div key={i} className={`relative overflow-hidden ${i === 0 ? 'col-span-2 sm:col-span-2 row-span-2' : ''}`} style={{ aspectRatio: i === 0 ? '16/9' : '4/3' }}>
                      <img src={img.url} alt={img.alt ?? acc.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              )}

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Categoría', value: typeLabel(acc.type), iconD: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z' },
                  { label: 'Ubicación', value: acc.province ?? 'República Dominicana', iconD: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z' },
                  { label: 'Calificación', value: acc.stars ? `${acc.stars} estrellas` : 'Sin clasificar', iconD: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z' },
                  { label: 'Precio desde', value: acc.price_min ? `$${acc.price_min}/noche` : 'Consultar', iconD: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z' },
                ].map(s => (
                  <div key={s.label} className="bg-dt-surface border border-dt-border rounded-xl p-3">
                    <svg className="w-5 h-5 text-accent mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={s.iconD} />
                    </svg>
                    <p className="font-bold text-dt-text text-sm">{s.value}</p>
                    <p className="text-dt-text-3 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              {acc.description && (
                <div className="bg-dt-surface border border-dt-border rounded-xl p-6">
                  <h2 className="font-display font-bold text-dt-text text-xl mb-3">Sobre el alojamiento</h2>
                  <p className="text-dt-text-2 leading-relaxed">{acc.description}</p>
                </div>
              )}

              {/* Amenities */}
              {Object.keys(amenities).length > 0 && (
                <div className="bg-dt-surface border border-dt-border rounded-xl p-6">
                  <h2 className="font-display font-bold text-dt-text text-xl mb-4">Comodidades y servicios</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(amenities).map(([label, iconKey]) => (
                      <div key={label} className="flex items-center gap-2.5 text-sm text-dt-text-2">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          {amenityIcons[iconKey] ? (
                            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={amenityIcons[iconKey]} />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact info */}
              {(acc.phone || acc.email || acc.address) && (
                <div className="bg-dt-surface border border-dt-border rounded-xl p-6">
                  <h2 className="font-display font-bold text-dt-text text-xl mb-4">Contacto y ubicación</h2>
                  <div className="flex flex-col gap-3">
                    {acc.address && (
                      <div className="flex items-start gap-3 text-sm text-dt-text-2">
                        <svg className="w-4 h-4 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                        </svg>
                        {acc.address}
                      </div>
                    )}
                    {acc.phone && (
                      <a href={`tel:${acc.phone}`} className="flex items-center gap-3 text-sm text-dt-text-2 hover:text-accent transition-colors">
                        <svg className="w-4 h-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
                        </svg>
                        {acc.phone}
                      </a>
                    )}
                    {acc.email && (
                      <a href={`mailto:${acc.email}`} className="flex items-center gap-3 text-sm text-dt-text-2 hover:text-accent transition-colors">
                        <svg className="w-4 h-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                        </svg>
                        {acc.email}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div className="bg-dt-surface border border-dt-border rounded-xl p-6">
                <h2 className="font-display font-bold text-dt-text text-xl mb-5">Reseñas</h2>
                {reviewStats.total > 0 && reviewStats.avg !== null ? (
                  <>
                    <div className="flex items-start gap-6 mb-5">
                      <div className="text-center shrink-0">
                        <div className="text-5xl font-black text-dt-text leading-none">{reviewStats.avg}</div>
                        <div className="flex gap-0.5 justify-center mt-2">
                          {[1,2,3,4,5].map(s => (
                            <svg key={s} className="w-4 h-4 fill-gold" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          ))}
                        </div>
                        <div className="text-xs text-dt-text-3 mt-1.5">Excelente · {reviewStats.total}</div>
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        {([[`5 ★`, reviewStats.distribution.r5], [`4 ★`, reviewStats.distribution.r4], [`3 ★`, reviewStats.distribution.r3], [`1-2 ★`, reviewStats.distribution.r12]] as [string, number][]).map(([label, cnt]) => {
                          const pct = reviewStats.total > 0 ? Math.round(cnt / reviewStats.total * 100) : 0
                          return (
                            <div key={label} className="flex items-center gap-2 text-xs">
                              <span className="text-dt-text-3 w-8 shrink-0">{label}</span>
                              <div className="flex-1 h-1.5 bg-dt-border rounded-full overflow-hidden">
                                <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-dt-text-3 w-6 text-right">{pct}%</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    {reviewStats.reviews.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {reviewStats.reviews.slice(0, 4).map((rev, i) => (
                          <div key={i} className="bg-dt-bg border border-dt-border rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                                {rev.firstName[0]}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-dt-text">{rev.firstName}{rev.country ? ` · ${rev.country}` : ''}</div>
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map(s => (
                                    <svg key={s} className={`w-2.5 h-2.5 ${s <= rev.rating ? 'fill-gold' : 'fill-dt-border'}`} viewBox="0 0 24 24">
                                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                  ))}
                                </div>
                              </div>
                            </div>
                            {rev.comment && <p className="text-xs text-dt-text-2 leading-relaxed">{rev.comment}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-dt-text-3 mb-4">Sé el primero en compartir tu experiencia en este alojamiento.</p>
                )}
                <Link
                  href={`/alojamientos/${slug}?review=1`}
                  className="block w-full text-center border border-dt-border text-dt-text-2 text-sm font-semibold py-2.5 rounded-xl hover:border-accent hover:text-accent transition-colors"
                >
                  ★ Calificar este alojamiento
                </Link>
              </div>
            </div>

            {/* Right — sticky booking panel */}
            <div className="lg:sticky lg:top-[104px] flex flex-col gap-3">
              <div className="bg-dt-surface border border-dt-border rounded-xl overflow-hidden">
                <div className="p-5 border-b border-dt-border">
                  <p className="text-dt-text-3 text-xs font-semibold uppercase tracking-widest mb-1">Precio por noche</p>
                  {acc.price_min ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-dt-text">${acc.price_min}</span>
                      {acc.price_max && acc.price_max > acc.price_min && (
                        <span className="text-dt-text-3 text-sm">— ${acc.price_max}</span>
                      )}
                      <span className="text-dt-text-3 text-xs">/noche</span>
                    </div>
                  ) : (
                    <p className="text-dt-text-2 font-semibold">Consultar precio</p>
                  )}
                  {acc.stars && (
                    <div className="flex gap-0.5 mt-2">
                      {Array.from({ length: acc.stars }).map((_, i) => (
                        <svg key={i} className="w-3.5 h-3.5 fill-amber-400" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col gap-3">
                  {acc.booking_url && (
                    <a href={acc.booking_url} target="_blank" rel="noopener noreferrer"
                      className="block w-full text-center bg-accent hover:bg-accent/90 text-white font-bold text-sm py-3.5 rounded-xl transition-colors">
                      Reservar ahora
                    </a>
                  )}
                  {acc.website && acc.website !== acc.booking_url && (
                    <a href={acc.website} target="_blank" rel="noopener noreferrer"
                      className="block w-full text-center border border-dt-border text-dt-text-2 hover:border-accent hover:text-accent font-semibold text-sm py-3 rounded-xl transition-colors">
                      Visitar sitio web
                    </a>
                  )}
                  <a
                    href={`https://wa.me/18095550100?text=Hola!%20Quisiera%20información%20sobre%20${encodeURIComponent(acc.name)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-400 font-semibold text-sm py-3 rounded-xl transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.528 5.854L0 24l6.335-1.652A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.894 0-3.66-.52-5.17-1.424l-.37-.22-3.797.995.995-3.7-.24-.382A9.959 9.959 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    Consultar por WhatsApp
                  </a>
                </div>
              </div>

              {/* Mini map / location card */}
              {(acc.address || acc.province) && (
                <div className="bg-dt-surface border border-dt-border rounded-xl p-4">
                  <p className="text-xs font-bold text-dt-text-3 uppercase tracking-wider mb-2">Ubicación</p>
                  <p className="text-sm text-dt-text-2 leading-snug">{acc.address ?? acc.province}</p>
                  {acc.province && (
                    <p className="text-xs text-dt-text-3 mt-0.5">{acc.province}, República Dominicana</p>
                  )}
                </div>
              )}

              {/* Policy note */}
              <div className="bg-dt-bg border border-dt-border rounded-xl p-4">
                <p className="text-xs text-dt-text-3 leading-relaxed">
                  Los precios son orientativos. La disponibilidad y tarifas finales se confirman directamente con el alojamiento o en la plataforma de reservas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AccommodationReviewModal accommodationSlug={slug} accommodationName={acc.name} />
    </>
  )
}
