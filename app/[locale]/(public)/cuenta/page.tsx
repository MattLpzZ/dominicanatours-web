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

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Pendiente',  color: '#F59E0B' },
  CONFIRMED: { label: 'Confirmada', color: '#22C55E' },
  COMPLETED: { label: 'Completada', color: '#38BDF8' },
  CANCELLED: { label: 'Cancelada',  color: '#EF4444' },
}

export default async function CuentaPage() {
  const session = await auth()

  if (!session?.user?.email) {
    return (
      <section className="dt-sec">
      <div className="flex flex-col items-center justify-center px-4 py-24">
        <div className="w-full max-w-sm bg-dt-surface border border-dt-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <h1 className="text-dt-text font-bold text-xl mb-2">Mi Cuenta</h1>
          <p className="text-dt-text-2 text-sm mb-8">Inicia sesión para ver tus reservaciones y tours guardados.</p>
          <form action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/cuenta' })
          }}>
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
          <p className="text-dt-text-3 text-xs mt-4">
            <Link href="/mis-reservas" className="text-accent hover:underline">Buscar reserva por código</Link>
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
      include: { tour: { select: { name: true, slug: true } }, tourDate: { select: { date: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  const savedTours = customer?.savedTours ?? []

  async function toggleSubscribe() {
    'use server'
    if (!session?.user?.email) return
    const current = await prisma.customer.findUnique({ where: { email: session.user.email } })
    if (current) {
      await prisma.customer.update({
        where: { email: session.user.email },
        data: { subscribed: !current.subscribed },
      })
    }
  }

  return (
    <section className="dt-sec">
    <div className="pt-10 pb-16 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Profile card */}
        <div className="bg-dt-surface border border-dt-border rounded-2xl p-6 flex items-center gap-4">
          {session.user.image ? (
            <Image src={session.user.image} alt="" width={56} height={56}
              className="w-14 h-14 rounded-full shrink-0 border border-dt-border" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0 text-accent font-bold text-xl">
              {session.user.name?.[0] ?? '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-dt-text font-bold text-lg truncate">{session.user.name ?? 'Cliente'}</h1>
            <p className="text-dt-text-2 text-sm truncate">{session.user.email}</p>
          </div>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }) }}>
            <button type="submit" className="text-dt-text-3 hover:text-dt-text text-xs font-semibold px-3 py-1.5 rounded-lg border border-dt-border hover:border-white/20 transition-all shrink-0">
              Salir
            </button>
          </form>
        </div>

        {/* Email alerts toggle */}
        <div className="bg-dt-surface border border-dt-border rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-dt-text font-semibold text-sm">Alertas de ofertas por email</p>
            <p className="text-dt-text-3 text-xs mt-0.5">
              {customer?.subscribed ? 'Recibes notificaciones de descuentos exclusivos' : 'No recibes notificaciones de ofertas'}
            </p>
          </div>
          <form action={toggleSubscribe}>
            <button type="submit"
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${customer?.subscribed ? 'bg-accent' : 'bg-dt-border'}`}>
              <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 absolute top-1 ${customer?.subscribed ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </form>
        </div>

        {/* Saved tours */}
        <div>
          <h2 className="text-dt-text font-bold text-base mb-3">
            Tours guardados{savedTours.length > 0 && <span className="text-dt-text-3 font-normal text-sm ml-2">({savedTours.length})</span>}
          </h2>
          {savedTours.length === 0 ? (
            <div className="bg-dt-surface border border-dt-border rounded-2xl p-8 text-center">
              <svg className="w-10 h-10 text-dt-text-3 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              <p className="text-dt-text-2 text-sm mb-4">No tienes tours guardados aún.</p>
              <Link href="/excursiones" className="inline-flex items-center gap-2 bg-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-accent/90 transition-colors">
                Explorar excursiones →
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {savedTours.map(t => (
                <div key={t.id} className="bg-dt-surface border border-dt-border rounded-xl p-3 flex items-center gap-3">
                  {t.tourImage ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <Image src={t.tourImage} alt={t.tourName} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-dt-bg-2 flex items-center justify-center shrink-0 text-2xl">{t.categoryIcon || '🏝️'}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-dt-text font-semibold text-sm truncate">{t.tourName}</p>
                    <p className="text-accent font-bold text-sm">desde ${Number(t.priceAdult).toFixed(0)} USD</p>
                  </div>
                  <Link href={`/reservar/${t.tourSlug}`}
                    className="shrink-0 bg-accent text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-accent/90 transition-colors">
                    Reservar
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reservations */}
        <div>
          <h2 className="text-dt-text font-bold text-base mb-3">Mis Reservaciones</h2>
          {reservations.length === 0 ? (
            <div className="bg-dt-surface border border-dt-border rounded-2xl p-8 text-center">
              <p className="text-dt-text-2 text-sm mb-4">No tienes reservaciones registradas con este correo.</p>
              <Link href="/excursiones" className="inline-flex items-center gap-2 bg-accent text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-accent/90 transition-colors">
                Explorar excursiones →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reservations.map(rv => {
                const s = STATUS_LABEL[rv.status] ?? { label: rv.status, color: '#888' }
                return (
                  <div key={rv.id} className="bg-dt-surface border border-dt-border rounded-xl p-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-dt-text font-semibold text-sm truncate">{rv.tour.name}</p>
                      <p className="text-dt-text-3 text-xs mt-0.5">
                        {new Date(rv.tourDate.date).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {' · '}{rv.adults} adulto{rv.adults !== 1 ? 's' : ''}
                        {rv.children > 0 && ` · ${rv.children} menor${rv.children !== 1 ? 'es' : ''}`}
                      </p>
                      <p className="text-dt-text-3 text-xs mt-0.5 font-mono">#{rv.code}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ color: s.color, background: s.color + '20' }}>
                        {s.label}
                      </span>
                      <span className="text-dt-text font-bold text-sm">
                        ${Number(rv.totalAmount).toFixed(0)}<span className="text-dt-text-3 text-xs font-normal"> USD</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
    </section>
  )
}
