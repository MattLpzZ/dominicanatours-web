import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

function statusBadge(s: string) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: 'Pendiente', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    CONFIRMED: { label: 'Confirmada', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
    COMPLETED: { label: 'Completada', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
    CANCELLED: { label: 'Cancelada', cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
  }
  const v = map[s] ?? { label: s, cls: 'bg-gray-500/15 text-gray-400 border-gray-500/25' }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${v.cls}`}>
      {v.label}
    </span>
  )
}

export default async function SoportePage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [totalReservas, pendientes, confirmadasHoy, chatLogs, pendingReservations] = await Promise.all([
    prisma.reservation.count(),
    prisma.reservation.count({ where: { status: 'PENDING' } }),
    prisma.reservation.count({
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.chatLog.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.reservation.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        code: true, firstName: true, lastName: true, phone: true,
        adults: true, children: true, totalAmount: true, paymentMethod: true,
        createdAt: true,
        tour: { select: { name: true } },
      },
    }),
  ])

  // Group chat logs by session
  const sessionMap = new Map<string, { messages: string[]; lastAt: Date; firstAt: Date }>()
  for (const log of chatLogs) {
    const existing = sessionMap.get(log.sessionId)
    if (existing) {
      existing.messages.push(log.message)
      if (log.createdAt > existing.lastAt) existing.lastAt = log.createdAt
    } else {
      sessionMap.set(log.sessionId, {
        messages: [log.message],
        lastAt: log.createdAt,
        firstAt: log.createdAt,
      })
    }
  }

  const sessions = [...sessionMap.entries()]
    .sort((a, b) => b[1].lastAt.getTime() - a[1].lastAt.getTime())
    .slice(0, 30)

  const uniqueSessions = sessionMap.size
  const totalEscalated = chatLogs.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-dt-text">Soporte & Chat</h1>
        <p className="text-dt-text-3 text-sm mt-0.5">Consultas en tiempo real y gestión de reservas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pendientes', value: pendientes, note: 'esperando confirmación', color: 'text-amber-400' },
          { label: 'Confirmadas hoy', value: confirmadasHoy, note: 'nuevas confirmaciones', color: 'text-emerald-400' },
          { label: 'Sesiones de chat', value: uniqueSessions, note: 'últimos 7 días', color: 'text-blue-400' },
          { label: 'Escaladas a WA', value: totalEscalated, note: 'consultas sin resolver', color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="bg-dt-surface rounded-xl border border-dt-border p-4">
            <p className="text-dt-text-3 text-xs uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`font-display font-bold text-3xl ${s.color}`}>{s.value}</p>
            <p className="text-dt-text-3 text-xs mt-0.5">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <a
          href="https://wa.me/18095550100"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 bg-dt-surface rounded-xl border border-dt-border hover:border-emerald-500/40 transition-colors group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-emerald-400 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <p className="text-dt-text text-sm font-semibold group-hover:text-emerald-400 transition-colors">Abrir WhatsApp</p>
            <p className="text-dt-text-3 text-xs">Atender consultas directas</p>
          </div>
        </a>

        <Link
          href="/admin/reservas"
          className="flex items-center gap-3 px-4 py-3 bg-dt-surface rounded-xl border border-dt-border hover:border-amber-500/40 transition-colors group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <p className="text-dt-text text-sm font-semibold group-hover:text-amber-400 transition-colors">Reservas pendientes</p>
            <p className="text-dt-text-3 text-xs">{pendientes} por confirmar</p>
          </div>
        </Link>

        <Link
          href="/admin/reservas/nueva"
          className="flex items-center gap-3 px-4 py-3 bg-dt-surface rounded-xl border border-dt-border hover:border-accent/40 transition-colors group"
        >
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
          </div>
          <div>
            <p className="text-dt-text text-sm font-semibold group-hover:text-accent transition-colors">Nueva reserva manual</p>
            <p className="text-dt-text-3 text-xs">Registrar por WhatsApp/teléfono</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pending reservations */}
        <div className="bg-dt-surface rounded-xl border border-dt-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dt-border">
            <div>
              <h2 className="font-semibold text-dt-text text-sm">Reservas que necesitan atención</h2>
              <p className="text-dt-text-3 text-xs mt-0.5">Pendientes de confirmación</p>
            </div>
            <Link href="/admin/reservas" className="text-xs text-accent hover:underline">Ver todas →</Link>
          </div>

          {pendingReservations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p className="text-dt-text-3 text-sm">Sin reservas pendientes</p>
            </div>
          ) : (
            <div className="divide-y divide-dt-border">
              {pendingReservations.map(r => (
                <div key={r.code} className="flex items-start gap-3 px-5 py-3.5 hover:bg-dt-bg-2 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs font-bold text-dt-text">{r.code}</span>
                      {statusBadge('PENDING')}
                    </div>
                    <p className="text-xs text-dt-text-2 truncate">{r.tour.name}</p>
                    <p className="text-xs text-dt-text-3 mt-0.5">
                      {r.firstName} {r.lastName} · {r.adults + r.children} pax · ${Number(r.totalAmount).toFixed(0)}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className="text-xs text-dt-text-3">{timeAgo(r.createdAt)}</span>
                    <a
                      href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${r.firstName}, te contactamos de Dominicana Tour sobre tu reserva ${r.code}.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WA
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat sessions */}
        <div className="bg-dt-surface rounded-xl border border-dt-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dt-border">
            <div>
              <h2 className="font-semibold text-dt-text text-sm">Consultas escaladas — últimos 7 días</h2>
              <p className="text-dt-text-3 text-xs mt-0.5">Preguntas que el bot no pudo responder</p>
            </div>
            <span className="text-xs text-dt-text-3 bg-dt-bg-2 px-2.5 py-1 rounded-full border border-dt-border">
              {uniqueSessions} sesiones
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p className="text-dt-text-3 text-sm">Sin consultas escaladas esta semana</p>
              <p className="text-dt-text-3 text-xs mt-1">El bot está respondiendo todo ✨</p>
            </div>
          ) : (
            <div className="divide-y divide-dt-border overflow-y-auto" style={{ maxHeight: '400px' }}>
              {sessions.map(([sid, data]) => {
                const lastMsg = data.messages[0]
                const waText = encodeURIComponent(`Hola! Vi tu consulta: "${lastMsg.slice(0, 100)}" — ¿en qué puedo ayudarte?`)
                return (
                  <div key={sid} className="flex items-start gap-3 px-5 py-3.5 hover:bg-dt-bg-2 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-dt-text text-sm leading-snug line-clamp-2">{lastMsg}</p>
                      {data.messages.length > 1 && (
                        <p className="text-dt-text-3 text-[11px] mt-0.5">+{data.messages.length - 1} mensaje{data.messages.length > 2 ? 's' : ''} más en esta sesión</p>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span className="text-dt-text-3 text-xs whitespace-nowrap">{timeAgo(data.lastAt)}</span>
                      <a
                        href={`https://wa.me/18095550100?text=${waText}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold whitespace-nowrap"
                      >
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Responder
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
