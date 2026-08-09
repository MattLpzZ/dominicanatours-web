export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

export default async function ClientesPage() {
  const [customers, reservCounts] = await Promise.all([
    prisma.customer.findMany({
      include: { _count: { select: { savedTours: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.reservation.groupBy({
      by: ['email'],
      _count: { id: true },
    }),
  ])

  const reservByEmail = new Map(reservCounts.map(r => [r.email.toLowerCase(), r._count.id]))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-dt-text">Clientes</h1>
          <p className="text-[13px] text-dt-text-3 mt-0.5">
            Usuarios registrados con Google · {customers.length} en total
          </p>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="bg-dt-surface border border-dt-border rounded-xl flex flex-col items-center justify-center py-20 gap-3">
          <svg className="w-10 h-10 text-dt-text-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
          </svg>
          <p className="text-dt-text-2 font-semibold text-sm">Aún no hay clientes registrados</p>
          <p className="text-dt-text-3 text-xs">Los usuarios que inicien sesión con Google aparecerán aquí</p>
        </div>
      ) : (
        <div className="bg-dt-surface border border-dt-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dt-border bg-dt-bg-2 text-dt-text-3 text-[11px] uppercase tracking-wide text-left">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium text-center">Reservas</th>
                  <th className="px-4 py-3 font-medium text-center">Guardados</th>
                  <th className="px-4 py-3 font-medium">Desde</th>
                  <th className="px-4 py-3 font-medium text-center">Newsletter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dt-border">
                {customers.map(c => {
                  const reservCount = reservByEmail.get(c.email.toLowerCase()) ?? 0
                  return (
                    <tr key={c.id} className="hover:bg-dt-bg-2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {c.image ? (
                            <img src={c.image} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                              <span className="text-accent text-xs font-bold">{(c.name ?? '?')[0].toUpperCase()}</span>
                            </div>
                          )}
                          <span className="text-[13px] font-medium text-dt-text">{c.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-dt-text-2">{c.email}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={[
                          'text-[12px] font-bold tabular-nums',
                          reservCount > 0 ? 'text-emerald-400' : 'text-dt-text-3',
                        ].join(' ')}>
                          {reservCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[12px] text-dt-text-3 tabular-nums">{c._count.savedTours}</span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-dt-text-3">{fmtDate(c.createdAt)}</td>
                      <td className="px-4 py-3 text-center">
                        {c.subscribed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                            Sí
                          </span>
                        ) : (
                          <span className="text-[11px] text-dt-text-3">No</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
