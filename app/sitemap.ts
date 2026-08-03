export const dynamic = 'force-dynamic'
import { MetadataRoute } from 'next'
import { fetchApi } from '@/lib/api'

interface ApiProduct {
  slug: string
  updated_at?: string
}

const BASE = 'https://dominicanatour.com'

function alt(path: string) {
  return {
    languages: {
      'es':    `${BASE}${path}`,
      'en':    `${BASE}/en${path}`,
      'x-default': `${BASE}${path}`,
    },
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: ApiProduct[] = []
  try {
    const res = await fetchApi<{ data: { products: ApiProduct[] } }>('/catalog')
    products = res.data.products
  } catch {}

  return [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
      alternates: alt('/'),
    },
    {
      url: `${BASE}/excursiones`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: alt('/excursiones'),
    },
    {
      url: `${BASE}/nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
      alternates: alt('/nosotros'),
    },
    {
      url: `${BASE}/terminos`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
      alternates: alt('/terminos'),
    },
    {
      url: `${BASE}/privacidad`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
      alternates: alt('/privacidad'),
    },
    ...products.map(t => ({
      url: `${BASE}/excursiones/${t.slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: alt(`/excursiones/${t.slug}`),
    })),
  ]
}
