export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import PdfButton from './PdfButton'
import ReportesNav from './ReportesNav'
import Link from 'next/link'

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
}

const STATUS_STYLE: Record<string, string> = {
  PENDING:   'bg-amber-500/15 text-amber-400',
  CONFIRMED: 'bg-emerald-500/15 text-emerald-400',
  COMPLETED: 'bg-blue-500/15 text-blue-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmada', COMPLETED: 'Completada', CANCELLED: 'Cancelada',
}
const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; month?: string }>
}) {
  const { tab = 'resumen', month } = await searchParams

  const now = new Date()
  let selYear  = now.getFullYear()
  let selMonth = now.getMonth() // 0-indexed

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number)
    selYear  = y
    selMonth = m - 1
  }

  const startOfSelMonth  = new Date(selYear, selMonth, 1)
  const endOfSelMonth    = new Date(selYear, selMonth + 1, 1)
  const startOfPrevMonth = new Date(selYear, selMonth - 1, 1)
  const endOfPrevMonth   = startOfSelMonth
  const startOf6Mo       = new Date(selYear, selMonth - 5, 1)

  // ── CLIENTES TAB ──────────────────────────────────────────────────────────
  if (tab === 'clientes') {
    const reservas = await prisma.reservation.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: {
        firstName: true, lastName: true, email: true, phone: true,
        country: true, hotelZone: true, language: true,
        totalAmount: true,
        tour: { select: { name: true } },
        tourDate: { select: { date: true } },
        status: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Deduplicate by phone or email
    const map = new Map<string, {
      email: string; phone: string; firstName: string; lastName: string
      country: string; hotelZone: string; language: string
      bookings: number; totalSpent: number
      lastTour: string; lastDate: string; firstDate: string
      tours: Set<string>
    }>()

    reservas.forEach(r => {
      const key = r.phone || r.email
      if (!key) return
      const dateStr = (r.tourDate.date instanceof Date ? r.tourDate.date : new Date(r.tourDate.date)).toISOString()
      if (map.has(key)) {
        const e = map.get(key)!
        e.bookings++
        e.totalSpent += Number(r.totalAmount)
        e.tours.add(r.tour.name)
        if (new Date(dateStr) > new Date(e.lastDate)) {
          e.lastTour = r.tour.name; e.lastDate = dateStr
        }
        if (new Date(dateStr) < new Date(e.firstDate)) e.firstDate = dateStr
      } else {
        map.set(key, {
          email: r.email, phone: r.phone,
          firstName: r.firstName, lastName: r.lastName,
          country: r.country, hotelZone: r.hotelZone, language: r.language,
          bookings: 1, totalSpent: Number(r.totalAmount),
          lastTour: r.tour.name, lastDate: dateStr, firstDate: dateStr,
          tours: new Set([r.tour.name]),
        })
      }
    })

    const clients = [...map.values()]
      .sort((a, b) => b.bookings - a.bookings)
      .map(c => ({ ...c, tours: [...c.tours] }))

    const totalRevenue = clients.reduce((s, c) => s + c.totalSpent, 0)
    const multiBookers = clients.filter(c => c.bookings > 1).length
    const countries    = new Set(clients.map(c => c.country).filter(Boolean)).size

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-dt-text">Reportes</h1>
            <p className="text-[13px] text-dt-text-3 mt-0.5">Métricas del negocio</p>
          </div>
          <PdfButton />
        </div>

        <ReportesNav tab={tab} month={month ?? `${selYear}-${String(selMonth+1).padStart(2,'0')}`} />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Clientes únicos',   value: clients.length },
            { label: 'Multi-reservas',    value: multiBookers },
            { label: 'Países distintos',  value: countries },
            { label: 'Ingresos totales',  value: fmtCurrency(totalRevenue) },
          ].map(s => (
            <div key={s.label} className="bg-dt-surface border border-dt-border rounded-xl px-4 py-3">
              <p className="text-dt-text-3 text-[11px] uppercase tracking-wide font-medium">{s.label}</p>
              <p className="text-dt-text text-2xl font-bold tabular-nums mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Clients table */}
        <div className="bg-dt-surface rounded-xl border border-dt-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-dt-border flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-dt-text">Base de clientes</h2>
            <Link href="/admin/marketing?tab=Contactos"
              className="text-[12px] font-semibold text-accent hover:underline">
              Ver en Marketing →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dt-border bg-dt-bg-2 text-dt-text-3 text-[11px] uppercase tracking-wide text-left">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">País · Zona</th>
                  <th className="px-4 py-3 font-medium text-center">Reservas</th>
                  <th className="px-4 py-3 font-medium">Excursiones</th>
                  <th className="px-4 py-3 font-medium">Total gastado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dt-border">
                {clients.map((c, i) => (
                  <tr key={i} className="hover:bg-dt-bg-2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-dt-text text-[13px]">{c.firstName} {c.lastName}</div>
                      {c.language && <div className="text-[11px] text-dt-text-3">{c.language}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {c.phone && (
                        <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                          className="text-[12px] text-emerald-400 hover:underline block">{c.phone}</a>
                      )}
                      {c.email && <div className="text-[11px] text-dt-text-3 truncate max-w-[150px]">{c.email}</div>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-[12px] text-dt-text-2">{c.country || '—'}</div>
                      <div className="text-[11px] text-dt-text-3">{c.hotelZone || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold text-[14px] ${c.bookings > 1 ? 'text-accent' : 'text-dt-text'}`}>{c.bookings}</span>
                      {c.bookings > 1 && <span className="block text-[10px] text-emerald-400 font-bold">recurrente</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[12px] text-dt-text-2 leading-snug max-w-[180px]">
                        {c.tours.slice(0, 2).join(', ')}
                        {c.tours.length > 2 && <span className="text-dt-text-3"> +{c.tours.length - 2} más</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[13px] tabular-nums">
                      {fmtCurrency(c.totalSpent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ── RESUMEN TAB ───────────────────────────────────────────────────────────
  const [
    allReservations,
    selMonthRevenue,
    prevMonthRevenue,
    toursWithStats,
    statusCounts,
    monthlySeries,
  ] = await Promise.all([
    prisma.reservation.count(),

    prisma.reservation.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: startOfSelMonth, lt: endOfSelMonth }, status: { not: 'CANCELLED' } },
    }),

    prisma.reservation.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: startOfPrevMonth, lt: endOfPrevMonth }, status: { not: 'CANCELLED' } },
    }),

    prisma.tour.findMany({
      where: { active: true },
      include: {
        category: { select: { name: true } },
        provider: { select: { name: true } },
        _count: { select: { reservations: true } },
        reservations: {
          where: { status: { not: 'CANCELLED' } },
          select: { totalAmount: true, adults: true, children: true },
        },
      },
      orderBy: { reservations: { _count: 'desc' } },
      take: 8,
    }),

    prisma.reservation.groupBy({ by: ['status'], _count: { _all: true } }),

    prisma.$queryRaw<{ month: string; revenue: number; count: number }[]>`
      SELECT
        DATE_FORMAT(createdAt, '%Y-%m') AS month,
        COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN CAST(totalAmount AS DECIMAL(10,2)) ELSE 0 END), 0) AS revenue,
        COUNT(*) AS count
      FROM Reservation
      WHERE createdAt >= ${startOf6Mo}
      GROUP BY month
      ORDER BY month ASC
    `,
  ]).catch(() => [0, null, null, [], [], []] as never)

  const thisRev   = Number(selMonthRevenue?._sum?.totalAmount ?? 0)
  const prevRev   = Number(prevMonthRevenue?._sum?.totalAmount ?? 0)
  const revDelta  = prevRev > 0 ? ((thisRev - prevRev) / prevRev) * 100 : 0
  const totalRev  = toursWithStats.reduce((s, t) => s + t.reservations.reduce((rs, r) => rs + Number(r.totalAmount), 0), 0)
  const maxMonRev = Math.max(...(Array.isArray(monthlySeries) ? monthlySeries.map((m: any) => Number(m.revenue)) : [0]), 1)
  const selMonthStr = `${selYear}-${String(selMonth+1).padStart(2,'0')}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-dt-text">Reportes</h1>
          <p className="text-[13px] text-dt-text-3 mt-0.5">Métricas del negocio · tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <PdfButton />
          <Link href="/admin/reservas"
            className="flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline">
            Ver reservas →
          </Link>
        </div>
      </div>

      <ReportesNav tab={tab} month={month ?? selMonthStr} />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: `Ingresos ${MONTH_NAMES[selMonth]} ${selYear}`,
            value: fmtCurrency(thisRev),
            sub: revDelta !== 0 ? `${revDelta > 0 ? '+' : ''}${revDelta.toFixed(0)}% vs mes anterior` : 'primer mes registrado',
            accent: 'bg-emerald-500/10 text-emerald-500',
            positive: revDelta >= 0,
            iconD: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 6v1m0 4v1m-3-6h6',
          },
          {
            label: 'Total reservas',
            value: String(allReservations),
            sub: 'acumulado histórico',
            accent: 'bg-blue-500/10 text-blue-400',
            iconD: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
          },
          {
            label: 'Ingresos totales',
            value: fmtCurrency(totalRev),
            sub: 'tours activos',
            accent: 'bg-violet-500/10 text-violet-400',
            iconD: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
          },
          {
            label: 'Pendientes',
            value: String(statusCounts.find((s: any) => s.status === 'PENDING')?._count?._all ?? 0),
            sub: 'requieren acción',
            accent: 'bg-amber-500/10 text-amber-400',
            iconD: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
          },
        ].map(s => (
          <div key={s.label} className="bg-dt-surface border border-dt-border rounded-xl p-5 flex items-start gap-4">
            <div className={['w-10 h-10 rounded-xl flex items-center justify-center shrink-0', s.accent].join(' ')}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d={s.iconD} />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-dt-text-3 truncate">{s.label}</p>
              <p className="text-2xl font-bold text-dt-text mt-0.5 tabular-nums">{s.value}</p>
              {'positive' in s && s.sub && (
                <p className={['text-[11px] mt-0.5', revDelta !== 0 ? (s.positive ? 'text-emerald-400' : 'text-red-400') : 'text-dt-text-3'].join(' ')}>{s.sub}</p>
              )}
              {!('positive' in s) && s.sub && <p className="text-[11px] mt-0.5 text-dt-text-3">{s.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Revenue bar chart */}
        <div className="bg-dt-surface border border-dt-border rounded-xl p-5">
          <h2 className="text-[13px] font-semibold text-dt-text mb-4">Ingresos mensuales (últimos 6 meses)</h2>
          {Array.isArray(monthlySeries) && monthlySeries.length > 0 ? (
            <div className="flex items-end gap-3 h-40">
              {monthlySeries.map((m: any) => {
                const rev = Number(m.revenue)
                const pct = (rev / maxMonRev) * 100
                const [, mo] = String(m.month).split('-')
                const isSel = m.month === selMonthStr
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <p className="text-[11px] text-dt-text-3 tabular-nums">{fmtCurrency(rev)}</p>
                    <div className="w-full flex flex-col justify-end" style={{ height: '88px' }}>
                      <div className={['w-full rounded-t-lg transition-all', isSel ? 'bg-accent' : 'bg-accent/30'].join(' ')}
                        style={{ height: `${Math.max(pct, 2)}%` }} />
                    </div>
                    <p className={['text-[11px] font-medium', isSel ? 'text-accent' : 'text-dt-text-3'].join(' ')}>
                      {MONTH_NAMES[parseInt(mo) - 1] ?? mo}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-dt-text-3 text-sm">Sin datos suficientes aún</p>
            </div>
          )}
        </div>

        {/* Status distribution */}
        <div className="bg-dt-surface border border-dt-border rounded-xl p-5">
          <h2 className="text-[13px] font-semibold text-dt-text mb-4">Distribución de estados</h2>
          <div className="flex flex-col gap-2.5">
            {Array.isArray(statusCounts) && statusCounts.map((s: any) => {
              const total = (statusCounts as any[]).reduce((a, x) => a + Number(x._count._all), 0)
              const pct   = total > 0 ? (Number(s._count._all) / total) * 100 : 0
              return (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[s.status] ?? 'bg-dt-bg-2 text-dt-text-3'}`}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                    <span className="text-[11px] text-dt-text-3 tabular-nums">{Number(s._count._all)} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-dt-bg-2 rounded-full overflow-hidden">
                    <div className={['h-full rounded-full', s.status === 'PENDING' ? 'bg-amber-400' : s.status === 'CONFIRMED' ? 'bg-emerald-400' : s.status === 'COMPLETED' ? 'bg-blue-400' : 'bg-red-400'].join(' ')}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top tours table */}
      <div className="bg-dt-surface border border-dt-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-dt-border">
          <h2 className="text-[13px] font-semibold text-dt-text">Tours por rendimiento</h2>
          <Link href="/admin/tours" className="text-[12px] font-semibold text-accent hover:underline">Gestionar →</Link>
        </div>
        {toursWithStats.length === 0 ? (
          <p className="text-dt-text-3 text-sm p-6">No hay tours aún</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dt-border bg-dt-bg-2 text-dt-text-3 text-[11px] uppercase tracking-wide text-left">
                  <th className="px-4 py-2.5 font-medium">Tour</th>
                  <th className="px-4 py-2.5 font-medium hidden md:table-cell">Proveedor</th>
                  <th className="px-4 py-2.5 font-medium text-center">Reservas</th>
                  <th className="px-4 py-2.5 font-medium">Ingresos</th>
                  <th className="px-4 py-2.5 font-medium hidden lg:table-cell">Costo prov.</th>
                  <th className="px-4 py-2.5 font-medium hidden lg:table-cell">Margen</th>
                  <th className="px-4 py-2.5 font-medium hidden md:table-cell"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dt-border">
                {toursWithStats.map((t, i) => {
                  const rev     = t.reservations.reduce((s, r) => s + Number(r.totalAmount), 0)
                  const pax     = t.reservations.reduce((s, r) => s + r.adults + r.children, 0)
                  const maxRev  = toursWithStats[0]?.reservations.reduce((s, r) => s + Number(r.totalAmount), 0) ?? 1
                  const pct     = maxRev > 0 ? (rev / maxRev) * 100 : 0
                  const cost    = t.costPrice ? Number(t.costPrice) * pax : null
                  const margin  = cost !== null ? rev - cost : null
                  const marginPct = (cost && cost > 0) ? ((rev - cost) / rev) * 100 : null

                  return (
                    <tr key={t.id} className="hover:bg-dt-bg-2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-dt-text-3 w-5 text-right shrink-0">#{i+1}</span>
                          <div>
                            <p className="font-medium text-dt-text text-[13px]">{t.name}</p>
                            <p className="text-[11px] text-dt-text-3">{t.category.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-[12px] text-dt-text-2">
                        {t.provider?.name ?? <span className="text-dt-text-3">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold text-[13px] tabular-nums ${t._count.reservations > 0 ? 'text-accent' : 'text-dt-text-3'}`}>
                          {t._count.reservations}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[13px] tabular-nums">{fmtCurrency(rev)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-[12px] text-dt-text-2 tabular-nums">
                        {cost !== null ? fmtCurrency(cost) : '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {margin !== null ? (
                          <span className={`text-[12px] font-semibold tabular-nums ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {fmtCurrency(margin)}
                            {marginPct !== null && <span className="text-[10px] ml-1 opacity-70">({marginPct.toFixed(0)}%)</span>}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell w-24">
                        <div className="h-1.5 bg-dt-bg-2 rounded-full overflow-hidden">
                          <div className="h-full bg-accent/60 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
