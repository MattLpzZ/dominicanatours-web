import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'

function SvgIcon({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={['w-3.5 h-3.5 shrink-0', className].filter(Boolean).join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const ICONS = {
  shield:   'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  star:     'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  lock:     'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  refresh:  'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  phone:    'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  mail:     'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  pin:      'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  clock:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
}

const SOCIAL = [
  {
    name: 'Instagram', href: 'https://instagram.com/dominicanatour',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    name: 'Facebook', href: 'https://facebook.com/dominicanatour',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    name: 'TikTok', href: 'https://tiktok.com/@dominicanatour',
    path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  },
  {
    name: 'YouTube', href: 'https://youtube.com/@dominicanatour',
    path: 'M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z',
  },
]

export async function Footer() {
  const t = await getTranslations('footer')

  let categories: { name: string; slug: string }[] = []
  let zones: string[] = []
  try {
    const [cats, zonesRaw] = await Promise.all([
      prisma.category.findMany({ select: { name: true, slug: true }, orderBy: { name: 'asc' } }),
      prisma.tour.findMany({ where: { active: true }, select: { departureZone: true }, distinct: ['departureZone'] }),
    ])
    categories = cats
    zones = zonesRaw
      .map((row: { departureZone: string | null }) => row.departureZone)
      .filter((z): z is string => !!z)
      .sort()
  } catch {}

  const TRUST_ITEMS = [
    { icon: ICONS.shield,  text: t('trustMitur') },
    { icon: ICONS.star,    text: t('trustReviews') },
    { icon: ICONS.lock,    text: t('trustPayment') },
    { icon: ICONS.refresh, text: t('trustCancel') },
  ]

  return (
    <footer className="bg-dt-dark text-white">
      {/* Trust bar */}
      <div className="border-b border-white/10 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-5">
            {TRUST_ITEMS.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-white/60">
                <SvgIcon d={icon} className="text-white/40" />
                <span>{text}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {['Visa', 'Mastercard', 'PayPal', 'Efectivo'].map(p => (
              <span key={p} className="text-white/35 text-[11px] font-medium border border-white/10 px-2 py-0.5 rounded">{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand col */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex mb-4">
              <Image src="/logo.svg" alt="Dominicana Tour" width={180} height={50} className="h-10 w-auto" />
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-5 max-w-xs">
              {t('description')}
            </p>
            <div className="flex gap-3">
              {SOCIAL.map(s => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-accent flex items-center justify-center transition-colors group"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white/60 group-hover:fill-white transition-colors">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Excursiones — dynamic from DB */}
          <div>
            <h5 className="font-bold text-xs uppercase tracking-widest mb-4 text-white/40">{t('colExcursiones')}</h5>
            <ul className="flex flex-col gap-2 text-sm text-white/60">
              <li>
                <Link href="/excursiones" className="hover:text-white transition-colors">{t('catalogoCompleto')}</Link>
              </li>
              {categories.slice(0, 6).map(cat => (
                <li key={cat.slug}>
                  <Link href={`/excursiones?cat=${cat.slug}`} className="hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Destinos — dynamic from DB */}
          <div>
            <h5 className="font-bold text-xs uppercase tracking-widest mb-4 text-white/40">{t('colDestinos')}</h5>
            <ul className="flex flex-col gap-2 text-sm text-white/60">
              {zones.slice(0, 7).map(zone => (
                <li key={zone}>
                  <Link
                    href={`/excursiones?zone=${encodeURIComponent(zone)}`}
                    className="hover:text-white transition-colors"
                  >
                    {zone}
                  </Link>
                </li>
              ))}
              {zones.length === 0 && (
                <li className="text-white/25 text-xs italic">Próximamente</li>
              )}
            </ul>
          </div>

          {/* Contacto — improved */}
          <div>
            <h5 className="font-bold text-xs uppercase tracking-widest mb-4 text-white/40">{t('colContacto')}</h5>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-3 mb-4">
              {[
                { icon: ICONS.phone, label: '(809) 555-0100', href: 'tel:+18095550100' },
                { icon: ICONS.mail,  label: 'info@dominicanatour.com', href: 'mailto:info@dominicanatour.com' },
                { icon: ICONS.pin,   label: 'Av. Francia 12, Santo Domingo', href: undefined },
                { icon: ICONS.clock, label: 'Lun–Sab · 8AM – 8PM', href: undefined },
              ].map(({ icon, label, href }) => (
                <div key={label} className="flex items-start gap-2.5 text-sm">
                  <SvgIcon d={icon} className="text-accent shrink-0 mt-0.5" />
                  {href ? (
                    <a href={href} className="text-white/70 hover:text-white transition-colors leading-snug break-all">{label}</a>
                  ) : (
                    <span className="text-white/60 leading-snug">{label}</span>
                  )}
                </div>
              ))}
            </div>

            <a
              href="https://wa.me/18095550100"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ea855] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors w-full"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('whatsappCta')}
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-white/30">
          <p>{t('copyrightText', { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-4">
            <Link href="/terminos" className="hover:text-white/60">{t('terminos')}</Link>
            <Link href="/privacidad" className="hover:text-white/60">{t('privacidad')}</Link>
            <span className="text-white/15">·</span>
            <a
              href="https://soymattlpzz.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/20 hover:text-white/50 transition-colors"
            >
              Powered by <span className="font-semibold">soymattlpzz</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
