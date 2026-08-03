import { prisma } from '@/lib/prisma'
import { Navbar } from './Navbar'

export async function NavbarServer() {
  let zones: string[] = []
  let categories: { name: string; slug: string; icon: string }[] = []

  try {
    const [tours, cats] = await Promise.all([
      prisma.tour.findMany({ select: { departureZone: true }, where: { active: true } }),
      prisma.category.findMany({ select: { name: true, slug: true, icon: true }, orderBy: { name: 'asc' } }),
    ])
    zones = [...new Set(tours.map(t => t.departureZone))].sort().slice(0, 12)
    categories = cats
  } catch {}

  return <Navbar zones={zones} categories={categories} />
}
