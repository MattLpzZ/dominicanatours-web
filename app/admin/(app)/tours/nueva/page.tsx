import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import TourWizard from '../TourWizard'

export const dynamic = 'force-dynamic'

export default async function NuevaTourPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-dt-text">Nueva excursión</h1>
        <p className="text-dt-text-3 text-sm mt-1">Completa los 3 pasos para registrar la excursión</p>
      </div>
      <TourWizard
        mode="create"
        categories={categories.map(c => ({ id: c.id, name: c.name }))}
      />
    </div>
  )
}
