'use client'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useSession, signIn } from 'next-auth/react'
import { useCart } from '@/lib/cart-store'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const SUB_NAV = [
  { label: 'Lugares que ver',      href: '/excursiones' },
  { label: 'Cosas que hacer',      href: '/excursiones' },
  { label: 'Inspiración de viaje', href: '/nosotros'    },
] as const

export function Navbar() {
  const t        = useTranslations('nav')
  const locale   = useLocale()
  const pathname = usePathname()
  const router   = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch]         = useState('')
  const { data: session }           = useSession()
  const { items }                   = useCart()

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const switchLocale = () => router.replace(pathname, { locale: locale === 'es' ? 'en' : 'es' })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) router.push(`/excursiones?q=${encodeURIComponent(search.trim())}`)
  }

  const subActive = (href: string) =>
    href === '/nosotros' ? pathname === '/nosotros' : pathname.startsWith('/excursiones')

  return (
    <>
      <nav
        className="sticky top-0 z-[200] bg-dt-bg border-b border-dt-border shadow-[0_1px_0_0_var(--color-border)]"
        style={{ '--nav-h': '104px' } as React.CSSProperties}
      >
        {/* ── Main row ── */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link href="/" className="shrink-0 font-display font-bold text-[19px] tracking-tight text-dt-text mr-4">
            Dominicana<span className="text-accent">Tour</span>
          </Link>

          {/* Search — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dt-text-3 pointer-events-none shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              type="text"
              placeholder="Buscar destino..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-full border border-dt-border bg-dt-bg-2 text-dt-text placeholder:text-dt-text-3 focus:outline-none focus:border-accent/40 transition-colors"
            />
          </form>

          <div className="hidden md:block flex-1" />

          {/* Right actions — desktop */}
          <div className="hidden md:flex items-center gap-1.5">
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

          {/* Mobile right */}
          <div className="md:hidden flex items-center gap-1 ml-auto">
            <ThemeToggle />
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="w-9 h-9 flex flex-col items-center justify-center gap-[5px]" aria-label="Menú">
              <span className={cn('block w-5 h-[1.5px] bg-dt-text rounded transition-all duration-250', mobileOpen && 'rotate-45 translate-y-[6.5px]')} />
              <span className={cn('block w-5 h-[1.5px] bg-dt-text rounded transition-all duration-250', mobileOpen && 'opacity-0 scale-x-0')} />
              <span className={cn('block w-5 h-[1.5px] bg-dt-text rounded transition-all duration-250', mobileOpen && '-rotate-45 -translate-y-[6.5px]')} />
            </button>
          </div>
        </div>

        {/* ── Sub-nav row ── */}
        <div className="hidden md:block border-t border-dt-border">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-stretch h-10">
            {SUB_NAV.map(item => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center px-4 text-[13px] font-medium border-b-2 transition-colors',
                  subActive(item.href) && pathname === item.href
                    ? 'border-accent text-dt-text'
                    : subActive(item.href) && item.href !== '/nosotros'
                    ? 'border-accent text-dt-text'
                    : pathname === item.href
                    ? 'border-accent text-dt-text'
                    : 'border-transparent text-dt-text-3 hover:text-dt-text hover:border-dt-border',
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={cn(
        'fixed inset-0 z-40 md:hidden flex flex-col bg-dt-bg transition-all duration-300',
        mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}>
        <div className="h-16 border-b border-dt-border shrink-0" />
        <div className="flex flex-col p-6 gap-0 flex-1 overflow-y-auto">
          <form onSubmit={handleSearch} className="relative mb-6">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dt-text-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              type="text"
              placeholder="Buscar destino..."
              className="w-full pl-9 pr-4 py-3 text-sm rounded-xl border border-dt-border bg-dt-bg-2 text-dt-text placeholder:text-dt-text-3 focus:outline-none"
            />
          </form>
          {SUB_NAV.map(item => (
            <Link key={item.label} href={item.href}
              className={cn(
                'text-2xl font-display font-bold py-4 border-b border-dt-border transition-colors',
                pathname === item.href ? 'text-accent' : 'text-dt-text hover:text-accent',
              )}>
              {item.label}
            </Link>
          ))}
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
