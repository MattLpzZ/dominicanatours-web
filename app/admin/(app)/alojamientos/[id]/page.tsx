import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'
import { redirect, notFound } from 'next/navigation'
import AlojamientoForm from '../AlojamientoForm'

export const dynamic = 'force-dynamic'

export default async function EditAlojamientoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  const { id } = await params
  const a = await prisma.accommodation.findUnique({
    where: { id: parseInt(id) },
    include: { images: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!a) notFound()
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-dt-text">Editar alojamiento</h1>
        <p className="text-dt-text-3 text-sm mt-1 font-mono">{a.slug}</p>
      </div>
      <AlojamientoForm
        mode="edit"
        initial={{
          id: a.id, name: a.name, type: a.type,
          stars: a.stars ? String(a.stars) : '',
          shortDescription: a.shortDescription ?? '',
          description: a.description ?? '',
          province: a.province ?? '', address: a.address ?? '',
          priceMin: a.priceMin ? String(a.priceMin) : '',
          priceMax: a.priceMax ? String(a.priceMax) : '',
          phone: a.phone ?? '', email: a.email ?? '',
          website: a.website ?? '', bookingUrl: a.bookingUrl ?? '',
          amenities: a.amenities ?? '', coverImage: a.coverImage ?? '',
          featured: a.featured, comingSoon: a.comingSoon, active: a.active,
        }}
        initialImages={a.images.map(img => ({
          id: img.id, url: img.url, alt: img.alt, sortOrder: img.sortOrder,
        }))}
      />
    </div>
  )
}
