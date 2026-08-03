export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
}
function fmtDate(d: Date) {
  return new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short' }).format(d)
}

const STATUS_STYLE: Record<string, string> = {
  PENDING:   'bg-amber-500/10 text-amber-500',
  CONFIRMED: 'bg-emerald-500/10 text-emerald-500',
  COMPLETED: 'bg-blue-500/10 text-blue-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmada', COMPLETED: 'Completada', CANCELLED: 'Cancelada',
}

function StatCard({ label, value, sub, icon, accent }: {
  label: string; value: string; sub?: string; icon: string; accent: string
}) {
  return (
    <div className="bg-dt-surface border border-dt-border rounded-xl p-5 flex items-start gap-4">
      <div className={['w-10 h-10 rounded-xl flex items-center justify-center shrink-0', accent].join(' ')}>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-dt-text-3 truncate">{label}</p>
        <p className="text-2xl font-bold text-dt-text mt-0.5 tabular-nums">{value}</p>
        {sub && <p className="text-[11px] text-dt-text-3 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const in14days = new Date(now)
  in14days.setDate(in14days.getDate() + 14)

  let tourCount = 0
  let pendingCount = 0
  let monthRevenue = 0
  let customerCount = 0
  let depositPending = 0
  let recentReservas: Array<{
    id: number; code: string; status: string; firstName: string; lastName: string
    adults: number; totalAmount: { toString(): string }; createdAt: Date
    tour: { name: string }
  }> = []
  let upcomingDates: Array<{
    id: number; date: Date
    tour: { name: string; slug: string }
    _count: { reservations: number }
    availableSpots: number
  }> = []

  try {
    const [tc, pc, mr, cc, dp, rr, ud] = await Promise.all([
      prisma.tour.count({ where: { active: true } }),
      prisma.reservation.count({ where: { status: 'PENDING' } }),
      prisma.reservation.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
      }),
      prisma.reservation.findMany({ select: { email: true }, distinct: ['email'] }).then(r => r.length),
      prisma.reservation.count({ where: { paidDeposit: false, status: { in: ['PENDING', 'CONFIRMED'] } } }),
      prisma.reservation.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { tour: { select: { name: true } } },
      }),
      prisma.tourDate.findMany({
        where: {
          date: { gte: now, lte: in14days },
          tour: { active: true },
        },
        include: {
          tour: { select: { name: true, slug: true } },
          _count: { select: { reservations: true } },
        },
        orderBy: { date: 'asc' },
        take: 6,
      }),
    ])
    tourCount     = tc
    pendingCount  = pc
    monthRevenue  = Number(mr._sum.totalAmount ?? 0)
    customerCount = cc
    depositPending = dp
    recentReservas = rr
    upcomingDates  = ud
  } catch {}

  const stats = [
    {
      label: 'Tours Activos', value: String(tourCount), sub: 'en el cat?logo',
      accent: 'bg-blue-500/10 text-blue-400',
      icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    },
    {
      label: 'Reservas Pendientes', value: String(pendingCount), sub: 'requieren atenci?n',
      accent: pendingCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-dt-bg-2 text-dt-text-3',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      label: 'Ingresos este mes', value: fmtCurrency(monthRevenue),
      sub: now.toLocaleString('es-DO', { month: 'long' }),
      accent: 'bg-emerald-500/10 text-emerald-500',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 6v1m0 4v1m-3-6h6',
    },
    {
      label: 'Anticipos pendientes', value: String(depositPending), sub: 'sin cobrar',
      accent: depositPending > 0 ? 'bg-red-500/10 text-red-400' : 'bg-dt-bg-2 text-dt-text-3',
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    },
  ]

  return (
    <div className="space-y-6">

      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-dt-text">Dashboard</h1>
          <p className="text-[13px] text-dt-text-3 mt-0.5">
            {now.toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {(pendingCount > 0 || depositPending > 0) && (
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Link href="/admin/reservas?status=PENDING"
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-[12px] font-semibold hover:bg-amber-500/15 transition-colors">
                <span className="w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] font-black flex items-center justify-center">
                  {pendingCount}
                </span>
                Pendientes
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

        {/* Recent reservas */}
        <div className="bg-dt-surface border border-dt-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-dt-border">
            <h2 className="text-[13px] font-semibold text-dt-text">Reservas Recientes</h2>
            <Link href="/admin/reservas" className="text-[12px] font-semibold text-accent hover:underline">
              Ver todas ?
            </Link>
          </div>

          {recentReservas.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 rounded-xl bg-dt-bg-2 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-dt-text-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-dt-text-3">No hay reservas a?n</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dt-border bg-dt-bg-2 text-dt-text-3 text-[11px] uppercase tracking-wide text-left">
                    <th className="px-4 py-3 font-medium">C?digo</th>
                    <th className="px-4 py-3 font-medium">Tour</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Cliente</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dt-border">
                  {recentReservas.map(r => (
                    <tr key={r.id} className="hover:bg-dt-bg-2 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/reservas?code=${r.code}`} className="font-mono text-xs font-bold text-accent hover:underline">
                          {r.code}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-dt-text text-[13px] max-w-[160px] truncate">{r.tour.name}</td>
                      <td className="px-4 py-3 text-dt-text-2 text-[13px] hidden sm:table-cell">{r.firstName} {r.lastName}</td>
                      <td className="px-4 py-3 font-semibold text-[13px] tabular-nums">{fmtCurrency(Number(r.totalAmount))}</td>
                      <td className="px-4 py-3">
                        <span className={['text-[11px] font-bold px-2 py-0.5 rounded-full', STATUS_STYLE[r.status] ?? 'bg-dt-bg-2 text-dt-text-3'].join(' ')}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-dt-text-3 text-[12px] hidden md:table-cell">{fmtDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming dates */}
        <div className="bg-dt-surface border border-dt-border rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-dt-border shrink-0">
            <h2 className="text-[13px] font-semibold text-dt-text">Pr?ximas fechas</h2>
            <span className="text-[11px] text-dt-text-3">14 d?as</span>
          </div>
          {upcomingDates.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-10">
              <p className="text-dt-text-3 text-sm">Sin fechas pr?ximas</p>
            </div>
          ) : (
            <div className="flex-1 divide-y divide-dt-border overflow-y-auto">
              {upcomingDates.map(d => {
                const isToday = d.date.toDateString() === now.toDateString()
                const isTomorrow = d.date.toDateString() === tomorrow.toDateString()
                const spotsUsed = d._count.reservations
                const maxSpots = d.availableSpots ?? null
                const pct = maxSpots ? Math.min((spotsUsed / maxSpots) * 100, 100) : null
                const isFull = maxSpots ? spotsUsed >= maxSpots : false
                return (
                  <div key={d.id} className="px-4 py-3 hover:bg-dt-bg-2 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[13px] font-medium text-dt-text truncate">{d.tour.name}</p>
                      {isToday && <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent">Hoy</span>}
                      {isTomorrow && <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400">Ma?ana</span>}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-dt-text-3">
                      <span>{fmtDate(d.date)}</span>
                      <span className={isFull ? 'text-red-400 font-semibold' : ''}>
                        {spotsUsed} reserva{spotsUsed !== 1 ? 's' : ''}{maxSpots ? ` / ${maxSpots}` : ''}
                      </span>
                    </div>
                    {pct !== null && (
                      <div className="mt-1.5 h-1 bg-dt-bg-2 rounded-full overflow-hidden">
                        <div
                          className={['h-full rounded-full transition-all', isFull ? 'bg-red-400' : pct > 75 ? 'bg-amber-400' : 'bg-emerald-400'].join(' ')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <div className="px-4 py-3 border-t border-dt-border shrink-0">
            <Link href="/admin/tours" className="text-[12px] font-semibold text-dt-text-3 hover:text-accent transition-colors">
              Gestionar tours ?
            </Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            href: '/admin/reservas?status=PENDING',
            label: 'Reservas pendientes',
            desc: `${pendingCount} sin confirmar`,
            iconD: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
            accent: 'text-amber-400',
            bg: 'bg-amber-500/8 border-amber-500/15 hover:border-amber-500/30',
          },
          {
            href: '/admin/tours/nueva',
            label: 'Nueva excursi?n',
            desc: 'Agregar al cat?logo',
            iconD: 'M12 4v16m8-8H4',
            accent: 'text-accent',
            bg: 'bg-accent/5 border-accent/15 hover:border-accent/30',
          },
          {
            href: '/admin/reportes',
            label: 'Ver reportes',
            desc: 'M?tricas del mes',
            iconD: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
            accent: 'text-violet-400',
            bg: 'bg-violet-500/5 border-violet-500/15 hover:border-violet-500/30',
          },
          {
            href: '/admin/ofertas',
            label: 'Gestionar ofertas',
            desc: 'Descuentos activos',
            iconD: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
            accent: 'text-pink-400',
            bg: 'bg-pink-500/5 border-pink-500/15 hover:border-pink-500/30',
          },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className={['flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors group', a.bg].join(' ')}>
            <div className={['w-8 h-8 rounded-lg bg-dt-bg-2 flex items-center justify-center shrink-0', a.accent].join(' ')}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d={a.iconD} />
              </svg>
            </div>
            <div className="min-w-0">
              <p className={['text-[13px] font-semibold transition-colors truncate', a.accent].join(' ')}>{a.label}</p>
              <p className="text-[11px] text-dt-text-3 truncate">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  )
}

