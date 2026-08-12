import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function AlojamientosPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  const alojamientos = await prisma.accommodation.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { images: true } } },
  })

  const BADGE: Record<string, string> = {
    hotel: 'bg-blue-500/15 text-blue-400',
    resort: 'bg-purple-500/15 text-purple-400',
    villa: 'bg-emerald-500/15 text-emerald-400',
    apartamento: 'bg-amber-500/15 text-amber-400',
    hostel: 'bg-dt-text-3/15 text-dt-text-3',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-dt-text">Alojamientos</h1>
        <Link href="/admin/alojamientos/nuevo"
          className="bg-accent text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors">
          + Nuevo alojamiento
        </Link>
      </div>

      {alojamientos.length === 0 ? (
        <div className="text-center py-16 text-dt-text-3">
          <p className="text-sm">No hay alojamientos registrados.</p>
          <Link href="/admin/alojamientos/nuevo" className="mt-3 inline-block text-accent text-sm hover:underline">
            Agrega el primero →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {alojamientos.map(a => (
            <Link key={a.id} href={`/admin/alojamientos/${a.id}`}
              className="flex items-center gap-4 px-4 py-3.5 bg-dt-surface border border-dt-border rounded-xl hover:border-accent/40 transition-colors group">
              {a.coverImage ? (
                <div className="w-14 h-10 rounded-lg overflow-hidden bg-dt-bg-2 shrink-0">
                  <img src={a.coverImage} alt={a.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-10 rounded-lg bg-dt-bg-2 border border-dt-border shrink-0 flex items-center justify-center">
                  <svg className="w-5 h-5 text-dt-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-dt-text group-hover:text-accent transition-colors truncate">{a.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${BADGE[a.type] ?? 'bg-dt-bg-2 text-dt-text-3'}`}>{a.type}</span>
                  {a.stars && <span className="text-xs text-amber-400">{'★'.repeat(a.stars)}</span>}
                  {!a.active && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/10 text-gray-400">Inactivo</span>}
                  {a.featured && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400">Destacado</span>}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {a.province && <span className="text-xs text-dt-text-3">{a.province}</span>}
                  {(a.priceMin || a.priceMax) && (
                    <span className="text-xs text-dt-text-3">
                      USD {a.priceMin ? Number(a.priceMin).toFixed(0) : '?'}{a.priceMax ? `–${Number(a.priceMax).toFixed(0)}` : '+'}
                    </span>
                  )}
                  <span className="text-xs text-dt-text-3">{a._count.images} foto{a._count.images !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <svg className="w-4 h-4 text-dt-text-3 group-hover:text-accent shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
