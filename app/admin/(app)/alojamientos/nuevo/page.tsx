import { getAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import AlojamientoForm from '../AlojamientoForm'

export const dynamic = 'force-dynamic'

export default async function NuevoAlojamientoPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-dt-text">Nuevo alojamiento</h1>
        <p className="text-dt-text-3 text-sm mt-1">Completa los 3 pasos para registrar el alojamiento</p>
      </div>
      <AlojamientoForm mode="create" />
    </div>
  )
}
