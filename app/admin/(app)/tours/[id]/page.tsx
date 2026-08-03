import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'
import { redirect, notFound } from 'next/navigation'
import TourForm from '../TourForm'
import DatesSection from '../DatesSection'

export const dynamic = 'force-dynamic'

export default async function EditTourPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  const { id } = await params
  const [tour, categories] = await Promise.all([
    prisma.tour.findUnique({
      where: { id: parseInt(id) },
      include: { dates: { orderBy: { date: 'asc' }, include: { _count: { select: { reservations: true } } } } },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ])
  if (!tour) notFound()
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-dt-text">Editar excursion</h1>
        <p className="text-dt-text-3 text-sm mt-1 font-mono">{tour.slug}</p>
      </div>
      <TourForm
        categories={categories.map(c => ({ id: c.id, name: c.name }))}
        initial={{
          id: tour.id, name: tour.name, subtitle: tour.subtitle,
          description: tour.description, priceAdult: String(tour.priceAdult),
          priceChild: String(tour.priceChild), duration: tour.duration,
          difficulty: tour.difficulty, categoryId: String(tour.categoryId),
          maxPeople: String(tour.maxPeople), minAge: String(tour.minAge),
          departureZone: tour.departureZone, departureTime: tour.departureTime,
          languages: tour.languages, active: tour.active, featured: tour.featured,
        }}
      />
      <div className="mt-8">
        <DatesSection tourId={tour.id} dates={JSON.parse(JSON.stringify(tour.dates))} />
      </div>
    </div>
  )
}