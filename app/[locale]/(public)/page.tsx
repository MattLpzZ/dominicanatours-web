export const dynamic = 'force-dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { fetchApi } from '@/lib/api'
import { ParallaxImage } from '@/components/home/ParallaxImage'
import { HeroParticles } from '@/components/home/HeroParticles'
import { WaveDivider } from '@/components/home/WaveDivider'
import { StatsSection } from '@/components/home/StatsCounter'
import type { Metadata } from 'next'
import { getSiteConfig, DEFAULT_BANNERS, DEFAULT_STATS, DEFAULT_TESTIMONIALS } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Dominicana Tour | Operadora Turistica Oficial',
  description: 'Operadora turistica oficial en Republica Dominicana. Mas de 20 excursiones autenticas con guias certificados, grupos pequenos y transporte puerta a puerta.',
}

interface ApiCategory {
  id: number; name: string; slug: string; icon: string | null; color: string
}
interface ApiProduct {
  id: number; name: string; slug: string; subtitle: string | null
  price_adult: string; price_child: string; duration: string | null
  difficulty: string; featured: boolean; departure_zone: string | null
  cover_image: string | null
  category: ApiCategory & { icon: string | null }
}

function getCatColor(slug: string): string {
  const s = slug.toLowerCase()
  if (s.includes('playa') || s.includes('mar'))    return '#0099CC'
  if (s.includes('aventura'))                       return '#22C55E'
  if (s.includes('cultur') || s.includes('histor')) return '#F59E0B'
  if (s.includes('fauna') || s.includes('natural')) return '#10B981'
  if (s.includes('noctur'))                         return '#8B5CF6'
  return '#E85D20'
}

function getCatIconPath(slug: string): string {
  const s = slug.toLowerCase()
  if (s.includes('playa') || s.includes('mar'))
    return 'M2 12c2-3 5-4.5 10-4.5S20 9 22 12M2 17c2-3 5-4.5 10-4.5S20 14 22 17M2 7c2-3 5-4.5 10-4.5S20 4 22 7'
  if (s.includes('aventura'))
    return 'M8 3L3 21h18L14 3l-3 5-3-5z'
  if (s.includes('cultur') || s.includes('histor'))
    return 'M3 21h18M5 21V9l7-7 7 7v12M9 21v-6h6v6'
  if (s.includes('fauna') || s.includes('natural'))
    return 'M17 8C8 10 5.9 16.17 3.82 22H3M3 22c0-5 2-8.5 2-8.5M3 22s3-5 3-12c5 0 16-3 16-10'
  if (s.includes('noctur'))
    return 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'
  return 'M12 2C8 2 5 5 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-4-3-7-7-7z M12 11a2 2 0 100-4 2 2 0 000 4z'
}

function CatIcon({ slug, className }: { slug: string; className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={getCatIconPath(slug)} />
    </svg>
  )
}

function Ico({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

function OrganizationLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'TouristInformationCenter',
          name: 'Dominicana Tour',
          url: 'https://dominicanatour.com',
          logo: 'https://dominicanatour.com/logo.svg',
          description: 'Operadora turistica oficial en Republica Dominicana. Excursiones con guias locales certificados.',
          address: { '@type': 'PostalAddress', addressCountry: 'DO' },
          priceRange: '$$',
          aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '820' },
        }),
      }}
    />
  )
}

async function getData() {
  try {
    const res = await fetchApi<{ data: { products: ApiProduct[]; categories: ApiCategory[] } }>('/catalog')
    const { products, categories } = res.data
    const zones = [...new Set(
      products.map(p => p.departure_zone).filter((z): z is string => Boolean(z))
    )].slice(0, 12)
    const zoneCounts: Record<string, number> = {}
    products.forEach(p => { if (p.departure_zone) zoneCounts[p.departure_zone] = (zoneCounts[p.departure_zone] ?? 0) + 1 })
    return { featured: products.filter(p => p.featured).slice(0, 8), categories, zones, zoneCounts }
  } catch {
    return { featured: [] as ApiProduct[], categories: [] as ApiCategory[], zones: [] as string[], zoneCounts: {} as Record<string, number> }
  }
}

function MagCard({ tour, className = '' }: { tour: ApiProduct; className?: string }) {
  const coverImg = tour.cover_image
  const catColor = tour.category?.color ?? getCatColor(tour.category?.slug ?? '')
  return (
    <Link href={`/excursiones/${tour.slug}`}
      className={`group relative overflow-hidden rounded-xl block ${className}`}>
      {coverImg ? (
        <Image src={coverImg} alt={tour.name} fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
      ) : (
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${catColor}cc, #111111)` }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/25" />

      <div className="absolute top-3 left-3 z-10">
        <span className="inline-flex items-center gap-1.5 bg-black/35 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/15">
          <CatIcon slug={tour.category?.slug ?? ''} className="w-3 h-3" />
          {tour.category?.name}
        </span>
      </div>

      {tour.featured && (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full">TOP</span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <p className="text-white/55 text-xs mb-1 flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Ico d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-3 h-3" />
            {tour.duration}
          </span>
          <span>&middot;</span>
          <span className="flex items-center gap-1">
            <Ico d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" className="w-3 h-3" />
            {tour.departure_zone}
          </span>
        </p>
        <h3 className="font-display font-bold text-white text-lg leading-tight mb-2 group-hover:text-accent transition-colors">
          {tour.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-accent font-bold text-sm">desde ${Number(tour.price_adult).toFixed(0)} USD</span>
          <span className="text-white/50 text-xs opacity-0 group-hover:opacity-100 transition-all duration-200">
            Ver mas &rarr;
          </span>
        </div>
      </div>
    </Link>
  )
}

export default async function LandingPage() {
  const [{ featured, categories, zones, zoneCounts }, config] = await Promise.all([getData(), getSiteConfig()])
  const bgTour    = featured[0]
  const editorial = featured.slice(0, 5)
  const moreTours = featured.slice(5)

  // Parse JSON config fields
  let banners = DEFAULT_BANNERS
  let stats   = DEFAULT_STATS
  let testimonials = DEFAULT_TESTIMONIALS
  try { if (config.banners_config)      banners      = JSON.parse(config.banners_config) } catch {}
  try { if (config.stats_config)        stats        = JSON.parse(config.stats_config)   } catch {}
  try { if (config.testimonials_config) testimonials = JSON.parse(config.testimonials_config) } catch {}

  const banner1 = banners[0] ?? DEFAULT_BANNERS[0]
  const banner2 = banners[1] ?? DEFAULT_BANNERS[1]
  const heroBgUrl = config.hero_bg_image || ''
  const heroCtaUrl = config.hero_cta_url || '/excursiones'

  return (
    <>
      <OrganizationLd />

      {/* HERO — left-anchored, bottom text */}
      <section className="relative h-[92vh] min-h-[580px] flex flex-col overflow-hidden dt-grain">
        {heroBgUrl ? (
          <Image src={heroBgUrl} alt="Hero" fill className="object-cover" priority />
        ) : bgTour?.cover_image ? (
          <ParallaxImage src={bgTour.cover_image} alt={bgTour.name} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1b4030] via-[#2a6448] to-[#0e2820]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/72" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
        {/* Animated shimmer layer */}
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-transparent dt-hero-shimmer pointer-events-none" />
        {/* Floating particles */}
        <HeroParticles />

        <div className="relative z-10 mt-auto max-w-7xl w-full mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
          <div className="mb-5">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-white/80 text-[11px] font-bold px-3 py-1.5 rounded-full tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Operadora certificada · Desde $45 USD
            </span>
          </div>

          <h1 className="font-display font-bold text-white text-[clamp(52px,9vw,96px)] leading-[0.93] tracking-[-0.04em] mb-5">
            <span data-dt-key="hero_title">{config.hero_title}</span><br /><span className="italic text-white/40">de verdad.</span>
          </h1>

          <p className="text-white/55 text-base sm:text-lg mb-8 max-w-md leading-relaxed" data-dt-key="hero_subtitle">
            {config.hero_subtitle}
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <Link href={heroCtaUrl}
              className="inline-flex items-center gap-2 bg-accent text-white font-bold text-sm px-6 py-3 rounded-lg hover:bg-accent/90 active:scale-95 transition-all">
              <span data-dt-key="hero_cta">{config.hero_cta}</span>
            </Link>
            <a href={`https://wa.me/${config.wa_number}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/18 text-white font-semibold text-sm px-5 py-3 rounded-lg hover:bg-white/18 transition-all">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#4ade80] shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 6).map(cat => (
                <Link key={cat.id} href={`/excursiones?cat=${cat.slug}`}
                  className="flex items-center gap-1.5 bg-white/8 border border-white/12 text-white/65 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-white/14 hover:text-white transition-all duration-200">
                  <CatIcon slug={cat.slug} className="w-3 h-3" />
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        {/* Wave divider */}
        <WaveDivider fill="#ffffff" />
      </section>

      {/* EDITORIAL GRID */}
      {editorial.length >= 3 && (
        <section data-reveal className="py-16 px-4 sm:px-6 max-w-7xl mx-auto dt-grain-light">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Lo mas reservado</p>
              <h2 className="font-display font-bold text-[#111111] text-3xl sm:text-4xl">
                Experiencias <span className="text-accent">imperdibles</span>
              </h2>
            </div>
            <Link href="/excursiones" className="text-sm font-bold text-[#717171] hover:text-accent transition-colors whitespace-nowrap hidden sm:block">
              Ver todas &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:h-[520px]">
            <MagCard tour={editorial[0]} className="md:col-span-2 h-72 md:h-auto" />
            <div className="flex md:flex-col gap-4">
              <MagCard tour={editorial[1]} className="flex-1 h-52 md:h-auto min-w-0" />
              <MagCard tour={editorial[2]} className="flex-1 h-52 md:h-auto min-w-0" />
            </div>
          </div>
          {editorial.length >= 5 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 h-auto sm:h-64">
              {editorial.slice(2, 5).map((t) => <MagCard key={t.id} tour={t} className="h-52 sm:h-auto" />)}
            </div>
          )}
          <div className="mt-6 sm:hidden text-center">
            <Link href="/excursiones" className="inline-flex items-center gap-2 text-sm font-bold text-accent border border-accent/30 px-6 py-2.5 rounded-full hover:bg-accent/5 transition-colors">
              Ver todas las excursiones &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* STATS STRIP */}
      <StatsSection stats={stats} />

      {/* PROMO BANNER 1 */}
      <section className="bg-white pt-10 pb-2 dt-grain-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-[#111111] rounded-2xl px-8 py-10 sm:px-12 sm:py-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent/8 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none dt-orb-1" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/3 blur-2xl translate-y-1/2 -translate-x-1/3 pointer-events-none dt-orb-2" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
              <div>
                <span className="inline-flex items-center gap-3 text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-5">
                  <span className="block w-5 h-[1.5px] bg-accent rounded-full" />
                  {banner1.tag}
                </span>
                <h2 className="font-display font-black text-white text-4xl sm:text-5xl leading-[1.0] mb-3">
                  {banner1.title}<br />
                  {banner1.accent && <span className="text-accent">{banner1.accent}</span>}
                </h2>
                <p className="text-white/30 text-sm max-w-xs">{banner1.sub}</p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                <Link href={banner1.btn_url || '/excursiones'}
                  className="inline-flex items-center gap-2 bg-accent text-white font-bold text-sm px-8 py-3.5 rounded-lg hover:bg-accent/90 active:scale-95 transition-all">
                  {banner1.btn_text} →
                </Link>
                <a href={`https://wa.me/${config.wa_number}`} target="_blank" rel="noopener noreferrer"
                  className="text-white/25 text-xs hover:text-white/55 transition-colors">
                  Consultar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY SHOWCASE */}
      {categories.length > 0 && (
        <section data-reveal className="py-16 bg-dt-bg-2 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="px-4 sm:px-6 mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Tipos de experiencia</p>
              <h2 className="font-display font-bold text-[#111111] text-3xl sm:text-4xl">Explora por actividad</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 sm:px-6 pb-2">
              {categories.map(cat => {
                const color = cat.color ?? getCatColor(cat.slug)
                return (
                  <Link key={cat.id} href={`/excursiones?cat=${cat.slug}`}
                    className="group shrink-0 relative w-44 h-64 rounded-xl overflow-hidden block transition-transform duration-300 hover:-translate-y-1"
                    style={{ background: `linear-gradient(160deg, ${color}ee, ${color}55)` }}>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-4 left-4 right-4 z-10">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                        <CatIcon slug={cat.slug} className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-white font-display font-bold text-base leading-tight">{cat.name}</p>
                    </div>
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </Link>
                )
              })}
              <Link href="/excursiones"
                className="shrink-0 w-44 h-64 rounded-xl border-2 border-dashed border-[#EBEBEB] flex flex-col items-center justify-center gap-2 text-[#717171] hover:border-accent hover:text-accent transition-colors">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
                </svg>
                <span className="text-xs font-bold uppercase tracking-wide">Ver todo</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* PROMO BANNER 2 */}
      <div className="px-4 sm:px-6 max-w-7xl mx-auto pt-2 pb-6">
        <a href={banner2.btn_url ? banner2.btn_url : `https://wa.me/${config.wa_number}?text=Hola%2C%20me%20interesa%20cotizar%20un%20tour%20privado`}
          target={banner2.btn_url.startsWith('/') ? undefined : '_blank'} rel="noopener noreferrer"
          className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-[#111111] rounded-2xl px-8 py-8 sm:px-10 relative overflow-hidden hover:shadow-[0_12px_48px_rgba(232,93,32,0.15)] transition-all duration-300">
          <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-white/10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 w-48 h-48 rounded-full bg-black/12 translate-y-2/3 pointer-events-none" />
          <div className="relative">
            <span className="flex items-center gap-2 text-white/55 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
              {banner2.tag}
            </span>
            <h3 className="font-display font-black text-white text-2xl sm:text-3xl mb-1.5">
              {banner2.title}
            </h3>
            <p className="text-white/60 text-sm">{banner2.sub}</p>
          </div>
          <span className="relative shrink-0 bg-[#E85D20] text-white font-bold text-sm px-7 py-3 rounded-lg group-hover:bg-white/94 transition-colors whitespace-nowrap">
            {banner2.btn_text} →
          </span>
        </a>
      </div>

      {/* EN EL RADAR */}
      {moreTours.length > 0 && (
        <section className="py-16 bg-white overflow-hidden dt-grain-light">
          <div className="max-w-7xl mx-auto">
            <div className="px-4 sm:px-6 mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">En el radar</p>
                <h2 className="font-display font-bold text-[#111111] text-3xl sm:text-4xl">Mas por descubrir</h2>
              </div>
              <Link href="/excursiones" className="text-sm font-bold text-[#717171] hover:text-accent transition-colors whitespace-nowrap">
                Ver catalogo &rarr;
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 sm:px-6 pb-2">
              {moreTours.map(t => <MagCard key={t.id} tour={t} className="shrink-0 w-64 h-80" />)}
            </div>
          </div>
        </section>
      )}

      {/* DESTINOS */}
      {zones.length > 0 && (
        <section data-reveal className="py-16 px-4 sm:px-6 bg-[#F7F7F7] dt-grain-light">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Donde operamos</p>
                <h2 className="font-display font-bold text-[#111111] text-3xl sm:text-4xl">Destinos en la isla</h2>
              </div>
              <Link href="/excursiones" className="text-sm font-bold text-[#717171] hover:text-accent transition-colors whitespace-nowrap hidden sm:block">
                Ver todos &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {zones.map((zone, i) => (
                <Link key={zone} href={`/excursiones?zone=${encodeURIComponent(zone)}`}
                  data-delay={String((i % 4) + 1)}
                  className="group flex items-center justify-between p-4 bg-white border border-[#EBEBEB] rounded-xl hover:border-accent/30 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-[#111111] text-sm leading-tight truncate">{zone}</p>
                    {zoneCounts[zone] && (
                      <p className="text-[#717171] text-xs mt-0.5">{zoneCounts[zone]} {zoneCounts[zone] === 1 ? 'tour' : 'tours'}</p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-[#EBEBEB] group-hover:text-accent/60 transition-colors shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WHY US */}
      <section className="py-16 bg-white relative overflow-hidden dt-grain-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-accent text-xs font-bold uppercase tracking-widest mb-2">Por que elegirnos?</p>
            <h2 className="font-display font-bold text-[#111111] text-3xl sm:text-4xl">La diferencia<br />Dominicana Tour</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 bg-[#F7F7F7] border border-[#EBEBEB] rounded-xl p-8 flex flex-col justify-between">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-display font-bold text-[#111111] text-2xl mb-3">Guias locales certificados</h3>
                <p className="text-[#717171] text-sm leading-relaxed">
                  Dominicanos nativos con certificacion del Ministerio de Turismo. Conocen cada rincon de la isla y hablan tu idioma.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-[#EBEBEB] flex items-center gap-2">
                <svg className="w-4 h-4 text-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-accent font-bold text-xs uppercase tracking-wide">Certificados</span>
              </div>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', title: 'Reserva 100% segura', desc: 'Confirmacion inmediata. Solo 20% de anticipo. Cancelacion gratuita hasta 48h antes.' },
                { icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0', title: 'Puerta a puerta', desc: 'Recogida y retorno desde tu hotel. Sin estres, sin costos ocultos.' },
                { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', title: 'Grupos pequenos', desc: 'Max. 15-20 personas. Mas atencion, mas autenticidad.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-[#F7F7F7] hover:bg-[#F0F0F0] border border-[#EBEBEB] rounded-xl p-6 transition-all duration-200 group">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/18 transition-colors">
                    <Ico d={icon} className="w-5 h-5 text-accent" />
                  </div>
                  <h4 className="font-display font-bold text-[#111111] text-base mb-2">{title}</h4>
                  <p className="text-[#717171] text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="relative py-20 overflow-hidden dt-grain">
        <Image src="https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1600&q=80"
          alt="Playa Republica Dominicana" fill className="object-cover" />
        <div className="absolute inset-0 bg-[#111111]/88" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">Testimonios</p>
            <h2 className="font-display font-bold text-white text-3xl sm:text-4xl">Lo que dicen nuestros viajeros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map(t => (
              <div key={t.name} className="bg-[#1C1C1C] border border-white/8 rounded-xl p-6 hover:border-white/18 transition-colors">
                <div className="text-4xl text-accent font-display font-bold leading-none mb-3 opacity-80">&ldquo;</div>
                <p className="text-white/80 text-sm leading-relaxed mb-5">{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/8">
                  <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center font-bold text-accent text-sm shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{t.name} <span className="text-white/40 text-xs font-normal">{t.origin}</span></div>
                    <div className="text-white/35 text-xs">{t.tour}</div>
                  </div>
                  <div className="ml-auto flex gap-0.5 shrink-0">
                    {[1,2,3,4,5].map(i => (
                      <svg key={i} className="w-3 h-3 fill-gold" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-accent relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/8" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-white text-4xl sm:text-5xl mb-4 leading-tight">{config.why_cta_title}</h2>
          <p className="text-white/75 text-lg mb-8 max-w-md mx-auto">
            {config.why_cta_text}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`https://wa.me/${config.wa_number}`}
              className="inline-flex items-center justify-center gap-2.5 bg-white text-accent font-bold text-base px-8 py-4 rounded-lg hover:bg-white/95 active:scale-95 transition-all shadow-lg">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Escribenos por WhatsApp
            </a>
            <Link href="/excursiones"
              className="inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur border border-white/30 text-white font-bold text-base px-8 py-4 rounded-lg hover:bg-white/25 transition-all">
              Ver excursiones &rarr;
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
