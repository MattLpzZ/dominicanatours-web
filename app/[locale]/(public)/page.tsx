export const revalidate = 300
import Link from 'next/link'
import Image from 'next/image'
import { fetchApi } from '@/lib/api'
import { TourCard } from '@/components/catalog/TourCard'
import { HeroSearch } from '@/components/ui/HeroSearch'
import type { ApiProduct, ApiCategory } from '@/components/catalog/ExcursionesClient'
import type { Metadata } from 'next'
import { getSiteConfig } from '@/lib/site-config'
import { getTranslations } from 'next-intl/server'

const BASE_URL = 'https://dominicanatour.com'

interface Props { params: Promise<{ locale: string }> }

interface ZoneData { name: string; count: number; image: string | null }

async function getData() {
  try {
    const res = await fetchApi<{ data: { products: ApiProduct[]; categories: ApiCategory[] } }>('/catalog', { next: { revalidate: 300 } })
    const { products, categories } = res.data

    const zoneMap = new Map<string, ZoneData>()
    products.forEach(p => {
      if (!p.departure_zone) return
      const z = zoneMap.get(p.departure_zone)
      if (!z) zoneMap.set(p.departure_zone, { name: p.departure_zone, count: 1, image: p.cover_image })
      else { z.count++; if (!z.image && p.cover_image) z.image = p.cover_image }
    })
    const zones: ZoneData[] = [...zoneMap.values()].sort((a, b) => b.count - a.count)

    const ranking = [...products]
      .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || Number(b.price_adult) - Number(a.price_adult))
      .slice(0, 10)

    const featured = products.filter(p => p.featured)
    const highlights = featured.length >= 4 ? featured : products.slice(0, 8)

    return { categories, zones, ranking, highlights }
  } catch {
    return { categories: [] as ApiCategory[], zones: [] as ZoneData[], ranking: [] as ApiProduct[], highlights: [] as ApiProduct[] }
  }
}

function ZoneInitials({ name }: { name: string }) {
  const words = name.split(' ').filter(Boolean)
  const initials = words.length >= 2 ? words[0][0] + words[1][0] : name.slice(0, 2)
  const colors = ['#0369a1','#0891b2','#1d4ed8','#15803d','#b45309','#7c3aed','#be185d','#0f766e']
  const idx = name.charCodeAt(0) % colors.length
  return (
    <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-2xl" style={{ background: colors[idx] }}>
      {initials.toUpperCase()}
    </div>
  )
}

function getCatColor(slug: string) {
  const s = slug.toLowerCase()
  if (s.includes('playa') || s.includes('mar'))     return '#0099CC'
  if (s.includes('aventura'))                        return '#22C55E'
  if (s.includes('cultur') || s.includes('histor')) return '#F59E0B'
  if (s.includes('fauna') || s.includes('natur'))   return '#10B981'
  if (s.includes('noctur'))                         return '#8B5CF6'
  const palette = ['#0099CC', '#22C55E', '#F59E0B', '#8B5CF6', '#E85D20', '#EC4899']
  return palette[slug.charCodeAt(0) % palette.length]
}

const ICON_KEY_MAP: Record<string, string> = {
  Waves: 'playa', Mountain: 'aventura', Landmark: 'cultur',
  Leaf: 'natur', Moon: 'noctur', TreePine: 'natur', Flame: 'aventura',
  Fish: 'playa', Compass: 'aventura', Footprints: 'aventura',
}

function CatIcon({ slug, icon }: { slug: string; icon?: string | null }) {
  const color = getCatColor(slug)
  const resolvedSlug = icon ? (ICON_KEY_MAP[icon] ?? slug.toLowerCase()) : slug.toLowerCase()
  const s = resolvedSlug
  const sp = { fill: 'none', stroke: 'white', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  let svgIcon: React.ReactNode
  if (s.includes('playa') || s.includes('mar')) {
    svgIcon = (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" {...sp}>
        <path d="M12 3a5 5 0 010 10"/>
        <path d="M2 16c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>
        <path d="M2 20c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>
      </svg>
    )
  } else if (s.includes('aventura')) {
    svgIcon = (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" {...sp}>
        <path d="M3 20h18L12 4 3 20z"/>
        <path d="M9.5 14.5 12 9l2.5 5.5"/>
      </svg>
    )
  } else if (s.includes('cultur') || s.includes('histor')) {
    svgIcon = (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" {...sp}>
        <path d="M3 21h18"/>
        <path d="M4 18h16"/>
        <path d="M6 18V9M10 18V9M14 18V9M18 18V9"/>
        <path d="M2 9h20M12 3 2 9h20L12 3z"/>
      </svg>
    )
  } else if (s.includes('fauna') || s.includes('natur')) {
    svgIcon = (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" {...sp}>
        <path d="M17 8C8 10 5.9 16.17 3.82 19.84"/>
        <path d="M3 18.01L4 20l2.5-2.5C7.32 16.84 8.87 16 10.5 16c2 0 4 1 4 3"/>
        <path d="M21 5c0 5.5-3.62 10.14-9 11"/>
      </svg>
    )
  } else if (s.includes('noctur')) {
    svgIcon = (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" {...sp}>
        <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
        <path d="M16 5l.5-1 .5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5z"/>
      </svg>
    )
  } else {
    svgIcon = (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" {...sp}>
        <circle cx="12" cy="12" r="9"/>
        <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>
      </svg>
    )
  }

  return (
    <div className="w-full h-full rounded-[10px] flex items-center justify-center" style={{ background: color }}>
      {svgIcon}
    </div>
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  const isEn = locale === 'en'

  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
    openGraph: {
      type: 'website',
      locale: isEn ? 'en_US' : 'es_DO',
      alternateLocale: isEn ? ['es_DO'] : ['en_US'],
      url: isEn ? `${BASE_URL}/en` : BASE_URL,
      siteName: 'Dominicana Tour',
      title: t('homeTitle'),
      description: t('homeDescription'),
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Dominicana Tour' }],
    },
    alternates: {
      canonical: isEn ? `${BASE_URL}/en` : BASE_URL,
      languages: {
        'es': BASE_URL,
        'en': `${BASE_URL}/en`,
        'x-default': BASE_URL,
      },
    },
  }
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params
  const [{ categories, zones, ranking, highlights }, config, t] = await Promise.all([
    getData(),
    getSiteConfig(),
    getTranslations({ locale, namespace: 'home' }),
  ])

  return (
    <>
      {/* ── HERO ── */}
      <section className="dt-sec px-4 sm:px-6 py-20 sm:py-24 text-center">
        <div className="max-w-[640px] mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-dt-text-3 mb-[18px]">
            {t('eyebrow')}
          </p>
          <h1
            className="font-display font-extrabold text-[clamp(32px,4.8vw,54px)] leading-[1.08] tracking-[-0.03em] text-dt-text mb-[14px]"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            {config.hero_title || 'Experiencias por las que vale la pena viajar'}
          </h1>
          <p className="text-base text-dt-text-3 mb-[34px] max-w-[440px] mx-auto leading-relaxed">
            {config.hero_subtitle || 'Descubre la República Dominicana con guías locales certificados.'}
          </p>
          <HeroSearch />
        </div>
      </section>

      {/* ── DESTINOS — horizontal scroll ── */}
      {zones.length > 0 && (
        <section className="dt-sec py-[52px]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
            <div className="flex items-end justify-between gap-3 mb-7">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dt-text-3 mb-1.5">{t('destinosEyebrow')}</p>
                <h2 className="text-[22px] font-extrabold tracking-[-0.022em] leading-[1.2] text-dt-text">{t('destinosTitle')}</h2>
              </div>
              <Link href="/excursiones" className="text-[13px] font-semibold text-accent hover:opacity-75 transition-opacity whitespace-nowrap hidden sm:block">
                {t('destinosLink')}
              </Link>
            </div>

            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-dt-surface to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-dt-surface to-transparent z-10 pointer-events-none" />
              <div className="flex gap-3.5 overflow-x-auto scrollbar-none pb-2 px-1" style={{ scrollSnapType: 'x mandatory' }}>
                {zones.map(zone => (
                  <Link
                    key={zone.name}
                    href={`/excursiones?zone=${encodeURIComponent(zone.name)}`}
                    className="group flex-shrink-0 cursor-pointer"
                    style={{ scrollSnapAlign: 'start', width: '176px' }}
                  >
                    <div className="relative rounded-lg overflow-hidden bg-dt-bg-2 mb-2.5" style={{ width: '176px', height: '176px' }}>
                      {zone.image ? (
                        <Image src={zone.image} alt={zone.name} fill className="object-cover transition-transform duration-[400ms] group-hover:scale-[1.07]" />
                      ) : (
                        <ZoneInitials name={zone.name} />
                      )}
                    </div>
                    <p className="text-[14px] font-bold text-dt-text mb-0.5 transition-colors group-hover:text-accent">{zone.name}</p>
                    <p className="text-[12px] text-dt-text-3">{zone.count} {zone.count === 1 ? 'tour' : 'tours'}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CATEGORÍAS ── */}
      {categories.length > 0 && (
        <section className="dt-sec py-[52px] px-4 sm:px-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="mb-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dt-text-3 mb-1.5">{t('catEyebrow')}</p>
              <h2 className="text-[22px] font-extrabold tracking-[-0.022em] leading-[1.2] text-dt-text">{t('catTitle')}</h2>
            </div>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))' }}>
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  href={`/excursiones?cat=${cat.slug}`}
                  className="flex flex-col items-center gap-2.5 p-[18px_12px] rounded-lg text-center border border-dt-border bg-dt-surface transition-[border-color,background,transform,box-shadow] duration-200 hover:border-accent/30 hover:-translate-y-[3px] hover:shadow-[0_4px_14px_rgba(232,93,32,0.08)] hover:bg-dt-bg-2"
                >
                  <div className="w-11 h-11">
                    <CatIcon slug={cat.slug} icon={cat.icon} />
                  </div>
                  <p className="text-[12px] font-semibold leading-[1.3] text-dt-text-2">{cat.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── RANKING ── */}
      {ranking.length > 0 && (
        <section className="dt-sec py-[52px] px-4 sm:px-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-end justify-between gap-3 mb-7">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dt-text-3 mb-1.5">{t('rankingEyebrow')}</p>
                <h2 className="text-[22px] font-extrabold tracking-[-0.022em] leading-[1.2] text-dt-text">{t('rankingTitle')}</h2>
              </div>
              <Link href="/excursiones" className="text-[13px] font-semibold text-accent hover:opacity-75 transition-opacity whitespace-nowrap hidden sm:block">
                {t('rankingLink')}
              </Link>
            </div>
            <div className="flex flex-col">
              {ranking.map((tour, i) => (
                <Link
                  key={tour.id}
                  href={`/excursiones/${tour.slug}`}
                  className="group grid items-center gap-4 py-[15px] px-3 border-b border-dt-border rounded-[5px] -mx-3 transition-colors hover:bg-dt-bg-2"
                  style={{ gridTemplateColumns: '28px 60px 1fr auto', borderTop: i === 0 ? '1px solid var(--color-border)' : undefined }}
                >
                  <span className="text-[14px] font-black text-dt-text-3 text-right tabular-nums group-hover:text-accent transition-colors">
                    {i + 1}
                  </span>
                  <div className="w-[60px] h-[60px] rounded-[5px] overflow-hidden bg-dt-bg-2 shrink-0">
                    {tour.cover_image ? (
                      <Image src={tour.cover_image} alt={tour.name} width={60} height={60}
                        className="w-full h-full object-cover transition-transform duration-[350ms] group-hover:scale-[1.06]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-dt-text-3 text-lg font-bold">
                        {tour.category?.name?.[0] ?? '?'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-dt-text mb-1 line-clamp-1">{tour.name}</p>
                    <div className="flex items-center gap-1.5 flex-wrap text-[12px] text-dt-text-3">
                      {tour.departure_zone && <span>{tour.departure_zone}</span>}
                      {tour.departure_zone && tour.category && <span className="text-dt-border-2">·</span>}
                      {tour.category && <span>{tour.category.name}</span>}
                      <span className="text-dt-border-2">·</span>
                      <span className="flex items-center gap-0.5">
                        <svg className="w-[11px] h-[11px] fill-[#F79009]" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        4.9 <span>(200+)</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-dt-text-3 mb-0.5">{t('rankingFrom')}</p>
                    <p className="text-[15px] font-extrabold tabular-nums text-dt-text">${Number(tour.price_adult).toFixed(0)} <span className="text-xs font-normal text-dt-text-3">USD</span></p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ATRACCIONES — TourCard grid ── */}
      {highlights.length > 0 && (
        <section className="dt-sec py-[52px] px-4 sm:px-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-end justify-between gap-3 mb-7">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dt-text-3 mb-1.5">{t('atrEyebrow')}</p>
                <h2 className="text-[22px] font-extrabold tracking-[-0.022em] leading-[1.2] text-dt-text">{t('atrTitle')}</h2>
              </div>
              <Link href="/excursiones" className="text-[13px] font-semibold text-accent hover:opacity-75 transition-opacity whitespace-nowrap hidden sm:block">
                {t('atrLink')}
              </Link>
            </div>
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {highlights.map(tour => <TourCard key={tour.id} tour={tour} />)}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
