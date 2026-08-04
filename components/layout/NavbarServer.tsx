import { Navbar, type ZoneNav, type CatNav } from './Navbar'
import { fetchApi } from '@/lib/api'

interface ApiProduct {
  departure_zone?: string
  cover_image: string | null
}
interface ApiCategory { id: number; name: string; slug: string }

export async function NavbarServer() {
  let zones: ZoneNav[]      = []
  let categories: CatNav[]  = []

  try {
    const res = await fetchApi<{ data: { products: ApiProduct[]; categories: ApiCategory[] } }>('/catalog')

    const zoneMap = new Map<string, ZoneNav>()
    res.data.products.forEach(p => {
      if (!p.departure_zone) return
      const z = zoneMap.get(p.departure_zone)
      if (!z) zoneMap.set(p.departure_zone, { name: p.departure_zone, count: 1, image: p.cover_image })
      else { z.count++; if (!z.image && p.cover_image) z.image = p.cover_image }
    })
    zones = [...zoneMap.values()].sort((a, b) => b.count - a.count).slice(0, 10)
    categories = res.data.categories.slice(0, 12)
  } catch {}

  return <Navbar zones={zones} categories={categories} />
}
