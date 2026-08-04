export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchApi } from '@/lib/api'
import { prisma } from '@/lib/prisma'
import { TourGallery } from '@/components/tour/TourGallery'
import { BookingWidget } from '@/components/tour/BookingWidget'
import { TourJsonLd } from '@/components/tour/TourJsonLd'
import { TourCard } from '@/components/catalog/TourCard'
import { AddToCartBtn } from '@/components/catalog/AddToCartBtn'
import { DifficultyBadge } from '@/components/ui/DifficultyBadge'
import { Badge } from '@/components/ui/Badge'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import type { ApiProduct } from '@/components/catalog/ExcursionesClient'
import { CopyLinkButton } from '@/components/tour/CopyLinkButton'

interface ApiItineraryItem {
  id: number; time: string | null; title: string; description: string | null; order: number
}
interface ApiIncludeItem {
  id: number; text: string; included: boolean
}
interface ApiProductDetail extends ApiProduct {
  description: string | null
  max_people: number | null
  min_age: number | null
  departure_time: string | null
  languages: string | null
  lat: number | null; lng: number | null
  itinerary: ApiItineraryItem[]
  includes: ApiIncludeItem[]
  images: { url: string; alt: string | null }[]
}

interface Props { params: Promise<{ locale: string; slug: string }> }

function fmtDate(d: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-DO', { day: 'numeric', month: 'short' }).format(d)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const BASE_URL = 'https://dominicanatour.com'
  const isEn = locale === 'en'
  const path = `/excursiones/${slug}`
  try {
    const res = await fetchApi<{ data: ApiProductDetail }>(`/catalog/${slug}`)
    const tour = res.data
    return {
      title: tour.name,
      description: tour.subtitle,
      alternates: {
        canonical: isEn ? `${BASE_URL}/en${path}` : `${BASE_URL}${path}`,
        languages: {
          'es': `${BASE_URL}${path}`,
          'en': `${BASE_URL}/en${path}`,
          'x-default': `${BASE_URL}${path}`,
        },
      },
      openGraph: {
        title: tour.name,
        description: tour.subtitle ?? undefined,
        type: 'website',
        locale: isEn ? 'en_US' : 'es_DO',
        images: tour.images[0] ? [{ url: tour.images[0].url, width: 1200, height: 630, alt: tour.name }] : [],
      },
    }
  } catch { return {} }
}

export default async function TourDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: 'tourDetail' })

  let tour: ApiProductDetail
  try {
    const res = await fetchApi<{ data: ApiProductDetail }>(`/catalog/${slug}`)
    tour = res.data
  } catch { notFound() }

  const offer = await prisma.tourOffer.findFirst({
    where: { tour: { slug }, active: true, startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
    orderBy: { discountPercent: 'desc' },
  }).catch(() => null)

  let related: ApiProduct[] = []
  try {
    const res = await fetchApi<{ data: { products: ApiProduct[] } }>('/catalog')
    related = res.data.products.filter(p => p.category?.slug === tour.category?.slug && p.id !== tour.id).slice(0, 3)
  } catch {}

  const diffLabel = (tour.difficulty?.toUpperCase() ?? 'EASY') as 'EASY' | 'MODERATE' | 'ADVANCED'
  const priceAdult  = Number(tour.price_adult)
  const priceChild  = Number(tour.price_child)
  const offerAdult  = offer ? Math.round(priceAdult * (1 - offer.discountPercent / 100)) : null
  const offerChild  = offer && priceChild > 0 ? Math.round(priceChild * (1 - offer.discountPercent / 100)) : null
  const included    = (tour.includes ?? []).filter(i => i.included)
  const excluded    = (tour.includes ?? []).filter(i => !i.included)
  const heroImg     = tour.images?.[0]?.url

  return (
    <>
      <TourJsonLd tour={tour} category={tour.category ?? { name: '', slug: '' }} />

        {/* Hero */}
        {heroImg ? (
          <div className="relative w-full pt-[60px] sm:pt-0 overflow-hidden" style={{ height: 'min(56vw, 500px)', minHeight: 260 }}>
            <img src={heroImg} alt={tour.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            {offer && (
              <div className="absolute top-20 right-4 sm:top-6 sm:right-6 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                -{offer.discountPercent}% {offer.label}
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-6 sm:pb-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge variant="green">{t('bestSeller')}</Badge>
                  {tour.category && <Badge variant="gray">{tour.category.icon} {tour.category.name}</Badge>}
                  <DifficultyBadge difficulty={diffLabel} size="md" />
                </div>
                <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-white mb-1.5 leading-tight">
                  {tour.name}
                </h1>
                <p className="text-white/75 text-sm sm:text-base max-w-2xl">{tour.subtitle}</p>
              </div>
            </div>
          </div>
        ) : (
          <section className="dt-sec">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge variant="green">{t('bestSeller')}</Badge>
                {tour.category && <Badge variant="gray">{tour.category.icon} {tour.category.name}</Badge>}
                <DifficultyBadge difficulty={diffLabel} size="md" />
              </div>
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-dt-text mb-2">{tour.name}</h1>
              <p className="text-dt-text-2">{tour.subtitle}</p>
            </div>
          </section>
        )}

        {/* Sticky meta bar */}
        <div className="bg-dt-surface border-b border-dt-border sticky top-[60px] z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm overflow-x-auto">
              <Link href="/" className="text-dt-text-3 hover:text-accent text-xs shrink-0">{t('home')}</Link>
              <span className="text-dt-border text-xs">/</span>
              <Link href="/excursiones" className="text-dt-text-3 hover:text-accent text-xs shrink-0">{t('tours')}</Link>
              <span className="text-dt-border text-xs">/</span>
              <span className="text-dt-text-2 text-xs font-semibold truncate max-w-[160px] sm:max-w-xs">{tour.name}</span>
              <div className="ml-auto flex items-center gap-4 shrink-0">
                <span className="text-amber-400 text-sm">★★★★★ <span className="text-dt-text-2 text-xs">4.9</span></span>
                {tour.departure_zone && (
                  <span className="hidden sm:flex items-center gap-1 text-dt-text-3 text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                    </svg>
                    {tour.departure_zone}
                  </span>
                )}
                <CopyLinkButton copyLabel={t('copyLink')} copiedLabel={t('linkCopied')} />
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <section className="dt-sec">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

            {/* Left */}
            <div className="flex flex-col gap-6 min-w-0">
              <TourGallery images={tour.images} />

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: t('duration'),  value: tour.duration,                                         iconD: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { label: t('group'),     value: tour.max_people ? t('maxGroup', { n: tour.max_people }) : '—', iconD: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                  { label: t('departure'), value: tour.departure_time ?? '—',                              iconD: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                  { label: t('languages'), value: (tour.languages ?? 'ES / EN').split(',')[0]?.trim(),    iconD: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' },
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
              <div className="bg-dt-surface border border-dt-border rounded-xl p-6">
                <h2 className="font-display font-bold text-dt-text text-xl mb-3">{t('description')}</h2>
                <p className="text-dt-text-2 leading-relaxed">{tour.description}</p>
              </div>

              {/* Includes / Excludes */}
              {(included.length > 0 || excluded.length > 0) && (
                <div className="bg-dt-surface border border-dt-border rounded-xl p-6">
                  <h2 className="font-display font-bold text-dt-text text-xl mb-4">{t('included')}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {included.length > 0 && (
                      <div>
                        <p className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest mb-3">{t('includedLabel')}</p>
                        <ul className="flex flex-col gap-2.5">
                          {included.map(inc => (
                            <li key={inc.id} className="flex items-start gap-2 text-sm text-dt-text-2">
                              <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                              </svg>
                              {inc.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {excluded.length > 0 && (
                      <div>
                        <p className="text-red-400 text-[11px] font-bold uppercase tracking-widest mb-3">{t('excludedLabel')}</p>
                        <ul className="flex flex-col gap-2.5">
                          {excluded.map(inc => (
                            <li key={inc.id} className="flex items-start gap-2 text-sm text-dt-text-2">
                              <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                              {inc.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Itinerary — timeline */}
              {tour.itinerary && tour.itinerary.length > 0 && (
                <div className="bg-dt-surface border border-dt-border rounded-xl p-6">
                  <h2 className="font-display font-bold text-dt-text text-xl mb-5">{t('itineraryDay')}</h2>
                  <div className="relative">
                    <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-accent/50 via-dt-border to-dt-border" />
                    <div className="flex flex-col">
                      {tour.itinerary.map((item, i) => (
                        <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                          <div className="relative z-10 w-10 h-10 shrink-0 rounded-full border-2 border-accent bg-dt-surface flex items-center justify-center">
                            <span className="text-accent text-xs font-bold font-display">{i + 1}</span>
                          </div>
                          <div className="flex-1 pt-1.5">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              {item.time && <span className="text-accent text-xs font-mono font-bold">{item.time}</span>}
                              <span className="font-semibold text-dt-text text-sm">{item.title}</span>
                            </div>
                            {item.description && (
                              <p className="text-dt-text-3 text-sm leading-relaxed">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Ratings */}
              <div className="bg-dt-surface border border-dt-border rounded-xl p-6">
                <h2 className="font-display font-bold text-dt-text text-xl mb-5">{t('ratings')}</h2>
                <div className="flex items-start gap-6 mb-5">
                  <div className="text-center shrink-0">
                    <div className="text-5xl font-black text-dt-text leading-none">4.9</div>
                    <div className="flex gap-0.5 justify-center mt-2">
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} className="w-4 h-4 fill-gold" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                    <div className="text-xs text-dt-text-3 mt-1.5">{t('excellent')}</div>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    {[['5 ★', 87],['4 ★', 10],['3 ★', 3],['1-2 ★', 0]].map(([label, pct]) => (
                      <div key={String(label)} className="flex items-center gap-2 text-xs">
                        <span className="text-dt-text-3 w-8 shrink-0">{label}</span>
                        <div className="flex-1 h-1.5 bg-dt-border rounded-full overflow-hidden">
                          <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-dt-text-3 w-6 text-right">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {[
                    { name: 'Carlos M.', country: '\u{1F1E9}\u{1F1F4}', text: 'Una experiencia increíble, los guías son excelentes y muy profesionales.' },
                    { name: 'Sophie L.',  country: '\u{1F1EB}\u{1F1F7}', text: "Parfait ! Nos guías parlaient français et l'organisation était impeccable." },
                  ].map(rev => (
                    <div key={rev.name} className="bg-dt-bg border border-dt-border rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                          {rev.name[0]}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-dt-text">{rev.name} {rev.country}</div>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <svg key={s} className="w-2.5 h-2.5 fill-gold" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-dt-text-2 leading-relaxed">{rev.text}</p>
                    </div>
                  ))}
                </div>
                <a
                  href={`https://wa.me/18095550100?text=Hola!%20Quiero%20compartir%20mi%20experiencia%20en%20${encodeURIComponent(tour.name)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="block w-full text-center border border-dt-border text-dt-text-2 text-sm font-semibold py-2.5 rounded-xl hover:border-accent hover:text-accent transition-colors"
                >
                  {t('shareExperience')}
                </a>
              </div>
            </div>

            {/* Right — sticky booking panel */}
            <div className="lg:sticky lg:top-[104px] flex flex-col gap-3">
              {/* Offer strip */}
              {offer && (
                <div className="bg-gradient-to-r from-red-500/15 to-transparent border border-red-500/25 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-red-400 text-xs font-bold">{offer.label} · {t('offerDiscount', { pct: offer.discountPercent })}</p>
                      <p className="text-red-300/60 text-[11px]">{t('offerValidUntil', { date: fmtDate(offer.endsAt, locale) })}</p>
                    </div>
                  </div>
                  {offerAdult !== null && (
                    <div className="mt-2 pt-2 border-t border-red-500/15 flex items-center gap-2">
                      <span className="text-dt-text-3 text-sm line-through">${priceAdult}</span>
                      <span className="text-white font-bold text-lg">${offerAdult}</span>
                      <span className="text-dt-text-3 text-xs">{t('pricePerAdult')}</span>
                    </div>
                  )}
                </div>
              )}

              <BookingWidget
                slug={tour.slug}
                priceAdult={offerAdult ?? priceAdult}
                priceChild={offerChild ?? priceChild}
              />
              <AddToCartBtn
                item={{
                  id: tour.id, slug: tour.slug, name: tour.name,
                  priceAdult: offerAdult ?? priceAdult,
                  imageUrl: tour.images[0]?.url ?? null,
                  categoryIcon: tour.category?.icon ?? '',
                }}
              />
              <p className="text-center text-xs text-dt-text-3">{t('saveSelection')}</p>
            </div>
          </div>
        </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="dt-sec py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="font-display font-black text-dt-text text-2xl mb-6">{t('relatedTitle')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {related.map(t => <TourCard key={t.id} tour={t} />)}
              </div>
            </div>
          </section>
        )}
    </>
  )
}
