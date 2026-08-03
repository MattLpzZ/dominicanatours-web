'use client'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useSession, signIn } from 'next-auth/react'
import { useCart } from '@/lib/cart-store'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface NavbarProps {
  zones?: string[]
  categories?: { name: string; slug: string; icon: string }[]
}

const ZONE_EMOJI: Record<string, string> = {
  'Punta Cana': '🌴', 'Santo Domingo': '🏛️', 'Samaná': '🐋', 'Puerto Plata': '⛰️',
  'La Romana': '🏖️', 'Cabarete': '🏄', 'Jarabacoa': '🌿', 'Bayahíbe': '🤿',
  'Bavaro': '🌊', 'Santiago': '🏙️', 'Las Terrenas': '🐚', 'Constanza': '🏔️',
}

function zoneEmoji(z: string) { return ZONE_EMOJI[z] ?? '📍' }

function catEmoji(slug: string) {
  const s = slug.toLowerCase()
  if (s.includes('playa') || s.includes('mar')) return '🏖️'
  if (s.includes('aventura'))                    return '🧗'
  if (s.includes('cultur') || s.includes('histor')) return '🏛️'
  if (s.includes('fauna') || s.includes('natural')) return '🌿'
  if (s.includes('noctur'))                      return '🌙'
  if (s.includes('acuat') || s.includes('buceo')) return '🤿'
  if (s.includes('famil'))                       return '👨‍👩‍👧'
  return '🗺️'
}

export function Navbar({ zones = [], categories = [] }: NavbarProps) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<'destinos' | 'excursiones' | null>(null)
  const { data: session } = useSession()
  const { items } = useCart()
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setMobileOpen(false); setOpenMenu(null) }, [pathname])

  const switchLocale = () => router.replace(pathname, { locale: locale === 'es' ? 'en' : 'es' })

  const enter = (m: 'destinos' | 'excursiones') => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenMenu(m)
  }
  const leave = () => { closeTimer.current = setTimeout(() => setOpenMenu(null), 130) }

  return (
    <>
      {/* Overlay */}
      <div className={cn('dt-overlay', openMenu && 'is-open')} onClick={() => setOpenMenu(null)} />

      <nav
        className="sticky top-0 z-[200] bg-dt-bg border-b border-dt-border h-16 shadow-[0_1px_0_0_var(--color-border)]"
        style={{ '--nav-h': '64px' } as React.CSSProperties}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0 font-display font-bold text-[19px] tracking-tight text-dt-text mr-6">
            Dominicana<span className="text-accent">Tour</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0 flex-1">
            {zones.length > 0 && (
              <button
                onMouseEnter={() => enter('destinos')}
                onMouseLeave={leave}
                className={cn(
                  'flex items-center gap-1 text-[13px] font-semibold px-3 py-1.5 rounded-lg transition-all select-none',
                  openMenu === 'destinos' ? 'text-dt-text bg-dt-bg-2' : 'text-dt-text-3 hover:text-dt-text hover:bg-dt-bg-2'
                )}>
                Destinos
                <svg className={cn('w-3.5 h-3.5 transition-transform duration-200', openMenu === 'destinos' && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}

            {categories.length > 0 ? (
              <button
                onMouseEnter={() => enter('excursiones')}
                onMouseLeave={leave}
                className={cn(
                  'flex items-center gap-1 text-[13px] font-semibold px-3 py-1.5 rounded-lg transition-all select-none',
                  openMenu === 'excursiones' ? 'text-dt-text bg-dt-bg-2' : 'text-dt-text-3 hover:text-dt-text hover:bg-dt-bg-2'
                )}>
                Excursiones
                <svg className={cn('w-3.5 h-3.5 transition-transform duration-200', openMenu === 'excursiones' && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            ) : (
              <Link href="/excursiones"
                className={cn(
                  'text-[13px] font-semibold px-3 py-1.5 rounded-lg transition-all',
                  pathname.startsWith('/excursiones') ? 'text-dt-text bg-dt-bg-2' : 'text-dt-text-3 hover:text-dt-text hover:bg-dt-bg-2',
                )}>
                {t('excursiones')}
              </Link>
            )}

            <Link href="/nosotros"
              className={cn(
                'text-[13px] font-semibold px-3 py-1.5 rounded-lg transition-all',
                pathname === '/nosotros' ? 'text-dt-text bg-dt-bg-2' : 'text-dt-text-3 hover:text-dt-text hover:bg-dt-bg-2',
              )}>
              {t('nosotros')}
            </Link>
          </div>

          {/* Desktop right actions */}
          <div className="hidden lg:flex items-center gap-2 ml-auto">
            <button onClick={switchLocale}
              className="text-[12px] font-bold px-2.5 py-1 rounded border border-dt-border text-dt-text-3 hover:text-dt-text hover:border-dt-text-3 transition-all tracking-wide">
              {t('langSwitch')}
            </button>
            <ThemeToggle />
            <Link href="/cuenta"
              className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-dt-bg-2 transition-all text-dt-text-3 hover:text-dt-text"
              aria-label="Tours guardados">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              {items.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {items.length}
                </span>
              )}
            </Link>
            {session?.user ? (
              <Link href="/cuenta"
                className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border border-dt-border hover:border-accent/40 transition-all shrink-0">
                {session.user.image
                  ? <img src={session.user.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  : <span className="w-full h-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">{(session.user.name ?? '?')[0]}</span>
                }
              </Link>
            ) : (
              <button
                onClick={() => signIn('google', { callbackUrl: '/cuenta' })}
                className="text-[13px] font-semibold px-3 py-1.5 rounded-lg text-dt-text-3 hover:text-dt-text hover:bg-dt-bg-2 transition-all">
                {t('entrar')}
              </button>
            )}
            <Link href="/excursiones"
              className="text-[13px] font-bold px-5 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 active:scale-95 transition-all">
              {t('reservar')}
            </Link>
          </div>

          {/* Mobile right actions */}
          <div className="lg:hidden flex items-center gap-1 ml-auto">
            <Link href="/cuenta"
              className="relative w-9 h-9 flex items-center justify-center text-dt-text-3"
              aria-label="Tours guardados">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              {items.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {items.length}
                </span>
              )}
            </Link>
            <button onClick={switchLocale}
              className="text-[11px] font-bold px-2 py-1 rounded border border-dt-border text-dt-text-3 hover:text-dt-text transition-all tracking-wide mr-0.5">
              {t('langSwitch')}
            </button>
            <ThemeToggle />
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="w-9 h-9 flex flex-col items-center justify-center gap-[5px]" aria-label="Menú">
              <span className={cn('block w-5 h-[1.5px] bg-dt-text rounded transition-all duration-250', mobileOpen && 'rotate-45 translate-y-[6.5px]')} />
              <span className={cn('block w-5 h-[1.5px] bg-dt-text rounded transition-all duration-250', mobileOpen && 'opacity-0 scale-x-0')} />
              <span className={cn('block w-5 h-[1.5px] bg-dt-text rounded transition-all duration-250', mobileOpen && '-rotate-45 -translate-y-[6.5px]')} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mega-dropdown: Destinos */}
      {zones.length > 0 && (
        <div
          className={cn('dt-dropdown', openMenu === 'destinos' && 'is-open')}
          onMouseEnter={() => enter('destinos')}
          onMouseLeave={leave}>
          <div className="dt-dropdown__inner">
            <div className="dt-dropdown__sidebar">
              <div className="dt-dropdown__sidebar-label">Destinos</div>
              <p className="text-[12px] leading-relaxed mb-4" style={{ color: 'var(--color-text-2)' }}>
                Tours puerta a puerta desde tu hotel en cada zona de la isla.
              </p>
              <Link href="/excursiones" onClick={() => setOpenMenu(null)}
                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-accent hover:underline">
                Ver todos los tours →
              </Link>
            </div>
            <div className="dt-dropdown__links">
              {zones.map(zone => (
                <Link key={zone} href={`/excursiones?zone=${encodeURIComponent(zone)}`}
                  onClick={() => setOpenMenu(null)}
                  className="dt-dropdown__link">
                  <div className="dt-dropdown__link-icon">{zoneEmoji(zone)}</div>
                  <div><div className="dt-dropdown__link-name">{zone}</div></div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mega-dropdown: Excursiones */}
      {categories.length > 0 && (
        <div
          className={cn('dt-dropdown', openMenu === 'excursiones' && 'is-open')}
          onMouseEnter={() => enter('excursiones')}
          onMouseLeave={leave}>
          <div className="dt-dropdown__inner">
            <div className="dt-dropdown__sidebar">
              <div className="dt-dropdown__sidebar-label">Categorías</div>
              <p className="text-[12px] leading-relaxed mb-4" style={{ color: 'var(--color-text-2)' }}>
                Desde excursiones en la playa hasta aventuras en la montaña.
              </p>
              <Link href="/excursiones" onClick={() => setOpenMenu(null)}
                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-accent hover:underline">
                Ver catálogo completo →
              </Link>
            </div>
            <div className="dt-dropdown__links">
              {categories.map(cat => (
                <Link key={cat.slug} href={`/excursiones?cat=${cat.slug}`}
                  onClick={() => setOpenMenu(null)}
                  className="dt-dropdown__link">
                  <div className="dt-dropdown__link-icon">{catEmoji(cat.slug)}</div>
                  <div><div className="dt-dropdown__link-name">{cat.name}</div></div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      <div className={cn(
        'fixed inset-0 z-40 lg:hidden flex flex-col bg-dt-bg transition-all duration-300',
        mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}>
        <div className="h-16 border-b border-dt-border shrink-0" />
        <div className="flex flex-col p-6 gap-0 flex-1 overflow-y-auto">
          {[
            { href: '/' as const,            label: t('inicio'),       match: (p: string) => p === '/' },
            { href: '/excursiones' as const,  label: t('excursiones'), match: (p: string) => p.startsWith('/excursiones') },
            { href: '/nosotros' as const,     label: t('nosotros'),    match: (p: string) => p === '/nosotros' },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className={cn(
                'text-3xl font-display font-bold py-4 border-b border-dt-border transition-colors',
                l.match(pathname) ? 'text-accent' : 'text-dt-text hover:text-accent',
              )}>
              {l.label}
            </Link>
          ))}

          {zones.length > 0 && (
            <div className="pt-6 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-dt-text-3 mb-3">Destinos</p>
              <div className="flex flex-wrap gap-2">
                {zones.map(zone => (
                  <Link key={zone} href={`/excursiones?zone=${encodeURIComponent(zone)}`}
                    className="text-sm font-semibold px-3 py-1.5 rounded-full bg-dt-bg-2 text-dt-text-2 hover:text-accent hover:bg-accent/5 transition-colors">
                    {zone}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-8 flex flex-col gap-3">
            <Link href="/excursiones"
              className="flex items-center justify-center bg-accent text-white font-bold py-3.5 rounded-lg text-base hover:bg-accent/90 transition-colors">
              {t('reservarExcursion')}
            </Link>
            {session?.user ? (
              <Link href="/cuenta"
                className="flex items-center justify-center gap-2 border border-dt-border text-dt-text-2 font-semibold py-3 rounded-lg text-sm transition-colors hover:bg-dt-bg-2">
                {t('miCuenta')}
              </Link>
            ) : (
              <button
                onClick={() => signIn('google', { callbackUrl: '/cuenta' })}
                className="flex items-center justify-center gap-2 border border-dt-border text-dt-text-3 font-semibold py-3 rounded-lg text-sm transition-colors hover:bg-dt-bg-2">
                {t('entrarConGoogle')}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
