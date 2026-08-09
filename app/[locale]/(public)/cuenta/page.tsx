export const dynamic = 'force-dynamic'
import { auth, signIn, signOut } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mi Cuenta | Dominicana Tour',
  description: 'Gestiona tu cuenta y consulta tus reservaciones.',
  robots: { index: false },
}

const STATUS: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:   { label: 'Pendiente',  bg: '#F59E0B22', text: '#F59E0B' },
  CONFIRMED: { label: 'Confirmada', bg: '#22C55E22', text: '#22C55E' },
  COMPLETED: { label: 'Completada', bg: '#38BDF822', text: '#38BDF8' },
  CANCELLED: { label: 'Cancelada',  bg: '#EF444422', text: '#EF4444' },
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function CuentaPage() {
  const session = await auth()

  if (!session?.user?.email) {
    return (
      <section className="dt-sec">
        <div className="flex flex-col items-center justify-center px-4 py-28">
          <div className="w-full max-w-sm bg-dt-surface border border-dt-border rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h1 className="text-dt-text font-bold text-xl mb-2">Mi Cuenta</h1>
            <p className="text-dt-text-2 text-sm mb-8 leading-relaxed">Inicia sesión para ver tus reservaciones y tours guardados.</p>
            <form action={async () => { 'use server'; await signIn('google', { redirectTo: '/cuenta' }) }}>
              <button type="submit"
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm">
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </button>
            </form>
            <p className="text-dt-text-3 text-xs mt-5">
              <Link href="/mis-reservas" className="text-accent hover:underline">Buscar reserva por código →</Link>
            </p>
          </div>
        </div>
      </section>
    )
  }

  const [customer, reservations] = await Promise.all([
    prisma.customer.findUnique({
      where: { email: session.user.email },
      include: { savedTours: { orderBy: { createdAt: 'desc' } } },
    }),
    prisma.reservation.findMany({
      where: { email: session.user.email },
      select: {
        id: true, code: true, status: true,
        adults: true, children: true, totalAmount: true,
        hotel: true, createdAt: true,
        tour: {
          select: {
            name: true, slug: true, departureZone: true,
            images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
          },
        },
        tourDate: { select: { date: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  // Filter out saved tours whose Tour is deleted/inactive
  const rawSaved = customer?.savedTours ?? []
  let savedTours = rawSaved
  if (rawSaved.length > 0) {
    const slugs = rawSaved.map(t => t.tourSlug)
    const active = await prisma.tour.findMany({
      where: { slug: { in: slugs }, active: true },
      select: { slug: true },
    })
    const activeSlugs = new Set(active.map(t => t.slug))
    savedTours = rawSaved.filter(t => activeSlugs.has(t.tourSlug))
    const orphaned = slugs.filter(s => !activeSlugs.has(s))
    if (orphaned.length && customer) {
      prisma.savedTour.deleteMany({ where: { customerId: customer.id, tourSlug: { in: orphaned } } }).catch(() => {})
    }
  }

  const totalSpent = reservations
    .filter(r => r.status !== 'CANCELLED')
    .reduce((s, r) => s + Number(r.totalAmount), 0)
  const activeTrips = reservations.filter(r => ['PENDING', 'CONFIRMED'].includes(r.status)).length

  async function toggleSubscribe() {
    'use server'
    if (!session?.user?.email) return
    const current = await prisma.customer.findUnique({ where: { email: session.user.email } })
    if (current) await prisma.customer.update({ where: { email: session.user.email }, data: { subscribed: !current.subscribed } })
  }

  return (
    <section className="dt-sec">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-20 space-y-8">

        {/* ── PROFILE HEADER ── */}
        <div className="bg-dt-surface border border-dt-border rounded-2xl overflow-hidden">
          <div className="p-6 flex items-start gap-4">
            {session.user.image ? (
              <Image src={session.user.image} alt="" width={64} height={64}
                className="w-16 h-16 rounded-full shrink-0 border-2 border-dt-border" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center shrink-0 text-accent font-bold text-2xl">
                {session.user.name?.[0] ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-dt-text font-bold text-xl leading-tight truncate">{session.user.name ?? 'Cliente'}</h1>
              <p className="text-dt-text-3 text-sm mt-0.5 truncate">{session.user.email}</p>
              {customer && (
                <p className="text-dt-text-3 text-xs mt-1.5">
                  Cliente desde {new Date(customer.createdAt).toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }) }}>
              <button type="submit"
                className="text-dt-text-3 hover:text-dt-text text-xs font-semibold px-3 py-1.5 rounded-lg border border-dt-border hover:border-dt-border-2 transition-all shrink-0">
                Salir
              </button>
            </form>
          </div>

          {/* Stats strip */}
          <div className="border-t border-dt-border grid grid-cols-3 divide-x divide-dt-border">
            {[
              { label: 'Reservaciones', value: reservations.length },
              { label: 'Tours guardados', value: savedTours.length },
              { label: 'Total gastado', value: `$${totalSpent.toFixed(0)} USD` },
            ].map(s => (
              <div key={s.label} className="px-5 py-4 text-center">
                <p className="text-dt-text font-black text-xl tabular-nums">{s.value}</p>
                <p className="text-dt-text-3 text-[11px] mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── NOTIFICACIONES ── */}
        <div className="bg-dt-surface border border-dt-border rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <svg className="w-4.5 h-4.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
              </svg>
            </div>
            <div>
              <p className="text-dt-text font-semibold text-sm">Alertas de ofertas por email</p>
              <p className="text-dt-text-3 text-xs mt-0.5">
                {customer?.subscribed ? 'Recibes descuentos exclusivos en tu bandeja' : 'Activa para recibir ofertas exclusivas'}
              </p>
            </div>
          </div>
          <form action={toggleSubscribe}>
            <button type="submit"
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${customer?.subscribed ? 'bg-accent' : 'bg-dt-border'}`}>
              <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 absolute top-1 ${customer?.subscribed ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </form>
        </div>

        {/* ── MIS VIAJES ── */}
        <div>
          <div className="flex items-end justify-between gap-2 mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dt-text-3 mb-1">Historial</p>
              <h2 className="text-[20px] font-extrabold tracking-tight text-dt-text leading-tight">
                Mis Viajes
                {reservations.length > 0 && <span className="text-dt-text-3 font-normal text-sm ml-2">({reservations.length})</span>}
              </h2>
            </div>
            {activeTrips > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-accent/15 text-accent">
                {activeTrips} próximo{activeTrips !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {reservations.length === 0 ? (
            <div className="bg-dt-surface border border-dt-border rounded-2xl p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-dt-bg-2 flex items-center justify-center mx-auto mb-4 text-2xl">🏝️</div>
              <p className="text-dt-text font-semibold mb-1.5">Aún no has reservado ningún tour</p>
              <p className="text-dt-text-3 text-sm mb-6">Explora nuestras excursiones y vive la experiencia dominicana.</p>
              <Link href="/excursiones"
                className="inline-flex items-center gap-2 bg-accent text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-accent/90 transition-colors">
                Explorar excursiones →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reservations.map(rv => {
                const s = STATUS[rv.status] ?? { label: rv.status, bg: '#88888822', text: '#888' }
                const imgUrl = rv.tour.images[0]?.url
                return (
                  <div key={rv.id} className="bg-dt-surface border border-dt-border rounded-xl overflow-hidden flex items-stretch gap-0 transition-colors hover:border-dt-border-2">
                    {/* Tour thumbnail */}
                    {imgUrl ? (
                      <div className="relative w-[88px] shrink-0 hidden sm:block">
                        <Image src={imgUrl} alt={rv.tour.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-[88px] shrink-0 bg-dt-bg-2 hidden sm:flex items-center justify-center text-3xl">🏝️</div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-dt-text font-bold text-sm truncate">{rv.tour.name}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-dt-text-3">
                          <span>{fmtDate(new Date(rv.tourDate.date))}</span>
                          <span className="text-dt-border">·</span>
                          <span>{rv.adults} adulto{rv.adults !== 1 ? 's' : ''}{rv.children > 0 ? ` · ${rv.children} menor${rv.children !== 1 ? 'es' : ''}` : ''}</span>
                          {rv.tour.departureZone && <><span className="text-dt-border">·</span><span>{rv.tour.departureZone}</span></>}
                        </div>
                        <p className="text-dt-text-3 text-[11px] font-mono mt-1.5 tracking-wide">#{rv.code}</p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5 shrink-0">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.text }}>
                          {s.label}
                        </span>
                        <p className="text-dt-text font-black text-base tabular-nums">
                          ${Number(rv.totalAmount).toFixed(0)}<span className="text-dt-text-3 text-xs font-normal"> USD</span>
                        </p>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="border-l border-dt-border flex items-center px-4 shrink-0">
                      <Link href={`/reserva/${rv.code}`}
                        className="text-xs font-semibold text-dt-text-3 hover:text-accent transition-colors whitespace-nowrap">
                        Ver detalle →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── TOURS GUARDADOS ── */}
        <div>
          <div className="flex items-end justify-between gap-2 mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dt-text-3 mb-1">Lista de deseos</p>
              <h2 className="text-[20px] font-extrabold tracking-tight text-dt-text leading-tight">
                Tours Guardados
                {savedTours.length > 0 && <span className="text-dt-text-3 font-normal text-sm ml-2">({savedTours.length})</span>}
              </h2>
            </div>
            {savedTours.length > 0 && (
              <Link href="/excursiones" className="text-[13px] font-semibold text-accent hover:opacity-75 transition-opacity whitespace-nowrap">
                Ver todos →
              </Link>
            )}
          </div>

          {savedTours.length === 0 ? (
            <div className="bg-dt-surface border border-dt-border rounded-2xl p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-dt-bg-2 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-dt-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                </svg>
              </div>
              <p className="text-dt-text font-semibold mb-1.5">Aún no guardaste ningún tour</p>
              <p className="text-dt-text-3 text-sm mb-6">Haz click en el corazón de cualquier excursión para guardarla aquí.</p>
              <Link href="/excursiones"
                className="inline-flex items-center gap-2 border border-dt-border text-dt-text-2 font-semibold text-sm px-6 py-2.5 rounded-xl hover:border-accent hover:text-accent transition-colors">
                Explorar excursiones
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {savedTours.map(t => (
                <div key={t.id} className="bg-dt-surface border border-dt-border rounded-xl overflow-hidden flex gap-0 group transition-colors hover:border-dt-border-2">
                  {t.tourImage ? (
                    <div className="relative w-24 shrink-0">
                      <Image src={t.tourImage} alt={t.tourName} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                  ) : (
                    <div className="w-24 shrink-0 bg-dt-bg-2 flex items-center justify-center text-3xl">{t.categoryIcon || '🏝️'}</div>
                  )}
                  <div className="flex-1 min-w-0 p-3.5 flex flex-col justify-between gap-2">
                    <div>
                      <p className="text-dt-text font-bold text-sm leading-snug line-clamp-2">{t.tourName}</p>
                      <p className="text-accent font-black text-sm mt-1">desde ${Number(t.priceAdult).toFixed(0)} <span className="text-dt-text-3 text-xs font-normal">USD</span></p>
                    </div>
                    <Link href={`/reservar/${t.tourSlug}`}
                      className="self-start text-[11px] font-bold bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent/90 transition-colors">
                      Reservar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ACCESO RAPIDO ── */}
        <div className="border-t border-dt-border pt-6 flex flex-wrap gap-3">
          <Link href="/mis-reservas"
            className="flex items-center gap-2 text-sm text-dt-text-2 font-semibold px-4 py-2.5 rounded-xl border border-dt-border hover:border-accent hover:text-accent transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            Buscar reserva por código
          </Link>
          <Link href="/excursiones"
            className="flex items-center gap-2 text-sm text-dt-text-2 font-semibold px-4 py-2.5 rounded-xl border border-dt-border hover:border-accent hover:text-accent transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497z"/>
            </svg>
            Explorar excursiones
          </Link>
        </div>

      </div>
    </section>
  )
}
