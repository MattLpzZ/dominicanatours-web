export const dynamic = 'force-dynamic'
import { fetchApi } from '@/lib/api'
import type { Metadata } from 'next'
import type { ApiProduct, ApiCategory } from '@/components/catalog/ExcursionesClient'
import { ExcursionesClient } from '@/components/catalog/ExcursionesClient'
import { getTranslations } from 'next-intl/server'

const BASE_URL = 'https://dominicanatour.com'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ cat?: string; diff?: string; zone?: string; sort?: string; q?: string; maxPrice?: string; duration?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  const isEn = locale === 'en'
  const path = '/excursiones'
  return {
    title: t('toursTitle'),
    description: t('toursDescription'),
    alternates: {
      canonical: isEn ? `${BASE_URL}/en${path}` : `${BASE_URL}${path}`,
      languages: {
        'es': `${BASE_URL}${path}`,
        'en': `${BASE_URL}/en${path}`,
        'x-default': `${BASE_URL}${path}`,
      },
    },
    openGraph: {
      locale: isEn ? 'en_US' : 'es_DO',
    },
  }
}


function ItemListLd({ tours }: { tours: ApiProduct[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Excursiones en Republica Dominicana',
          description: 'Catalogo completo de excursiones turisticas en Republica Dominicana',
          numberOfItems: tours.length,
          itemListElement: tours.slice(0, 20).map((t, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: 'https://dominicanatour.com/excursiones/' + t.slug,
            name: t.name,
          })),
        }),
      }}
    />
  )
}

export default async function CatalogPage({ searchParams }: Props) {
  const params = await searchParams

  let products: ApiProduct[] = []
  let categories: ApiCategory[] = []

  try {
    const res = await fetchApi<{ data: { products: ApiProduct[]; categories: ApiCategory[] } }>('/catalog')
    products = res.data.products
    categories = res.data.categories
  } catch {
    // API unavailable — render empty state
  }

  // Client-side filters are applied here on the server to pre-filter data
  let tours = products

  if (params.cat) {
    tours = tours.filter(t => t.category?.slug === params.cat)
  }
  if (params.diff) {
    tours = tours.filter(t => t.difficulty?.toLowerCase() === params.diff!.toLowerCase())
  }
  if (params.zone) {
    tours = tours.filter(t => t.departure_zone?.toLowerCase().includes(params.zone!.toLowerCase()))
  }
  if (params.q) {
    const q = params.q.toLowerCase()
    tours = tours.filter(t => t.name.toLowerCase().includes(q))
  }
  if (params.maxPrice) {
    tours = tours.filter(t => Number(t.price_adult) <= Number(params.maxPrice))
  }
  if (params.duration === 'half') {
    tours = tours.filter(t => t.duration?.toLowerCase().includes('medio'))
  } else if (params.duration === 'full') {
    tours = tours.filter(t => t.duration?.toLowerCase().includes('día') || t.duration?.toLowerCase().includes('dia'))
  }

  if (params.sort === 'price-asc') {
    tours = [...tours].sort((a, b) => Number(a.price_adult) - Number(b.price_adult))
  } else if (params.sort === 'price-desc') {
    tours = [...tours].sort((a, b) => Number(b.price_adult) - Number(a.price_adult))
  } else {
    tours = [...tours].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
  }

  return (
    <>
      <ItemListLd tours={tours} />
      <ExcursionesClient tours={tours} categories={categories} currentParams={params} />
    </>
  )
}
