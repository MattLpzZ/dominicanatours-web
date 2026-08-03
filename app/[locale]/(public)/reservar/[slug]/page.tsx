export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { fetchApi } from '@/lib/api'
import { CheckoutClient } from '@/components/booking/CheckoutClient'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ adults?: string; children?: string; date?: string }>
}

export const metadata: Metadata = { title: 'Reservar — Dominicana Tour' }

export default async function ReservarPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const adults   = Math.max(1, Number(sp.adults)   || 2)
  const children = Math.max(0, Number(sp.children) || 0)
  const date     = sp.date ?? ''

  let product: ApiProduct
  try {
    const res = await fetchApi<{ data: ApiProduct }>(`/catalog/${slug}`)
    product = res.data
  } catch {
    notFound()
  }

  return (
    <CheckoutClient
      product={product!}
      initialAdults={adults}
      initialChildren={children}
      initialDate={date || undefined}
    />
  )
}

// ── API shape (mirrors what the central API returns) ──
export interface ApiProduct {
  id: number
  slug: string
  name: string
  price_adult: number | string
  price_child: number | string
  duration: string
  departure_zone: string | null
  category: { name: string; icon: string }
  images: { url: string; alt: string }[]
}
