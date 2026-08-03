import Link from 'next/link'
import Image from 'next/image'
import { DifficultyBadge } from '@/components/ui/DifficultyBadge'
import { AddToCartBtn } from '@/components/catalog/AddToCartBtn'
import type { ApiProduct } from '@/components/catalog/ExcursionesClient'

export function TourCard({ tour }: { tour: ApiProduct }) {
  const coverImg = tour.cover_image
  const cartItem = {
    id: tour.id,
    slug: tour.slug,
    name: tour.name,
    priceAdult: Number(tour.price_adult),
    imageUrl: coverImg ?? null,
    categoryIcon: tour.category?.icon ?? '',
  }
  const diffLabel = tour.difficulty?.toUpperCase() as 'EASY' | 'MODERATE' | 'ADVANCED'

  return (
    <article className="group rounded-dt overflow-hidden bg-dt-surface border border-dt-border shadow-dt hover:shadow-dt-md transition-all duration-300 hover:-translate-y-1 card-shimmer flex flex-col">
      {/* Image */}
      <div className="relative h-52 shrink-0 overflow-hidden">
        {coverImg ? (
          <Image src={coverImg} alt={tour.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
        ) : (
          <div className="w-full h-full bg-dt-bg-2 flex items-center justify-center text-4xl">{tour.category?.icon}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Top chips */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <span className="bg-dt-surface/90 backdrop-blur-sm text-xs font-bold text-dt-text px-2.5 py-1 rounded-full">
            {tour.category?.icon} {tour.category?.name}
          </span>
          {tour.featured && (
            <span className="bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full shrink-0">⭐ Top</span>
          )}
        </div>

        {/* Price at bottom */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <span className="text-white/70 text-xs">★★★★★ 4.9</span>
          <span className="bg-accent text-white text-sm font-bold px-3 py-1 rounded-full">
            ${Number(tour.price_adult).toFixed(0)} USD
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2.5">
        <h3 className="font-display font-bold text-dt-text text-base leading-tight line-clamp-2">{tour.name}</h3>

        <div className="flex items-center gap-2 flex-wrap">
          <DifficultyBadge difficulty={diffLabel} />
          <span className="text-dt-text-3 text-xs">·</span>
          <span className="text-xs text-dt-text-2">⏱️ {tour.duration}</span>
          <span className="text-dt-text-3 text-xs">·</span>
          <span className="text-xs text-dt-text-2">📍 {tour.departure_zone}</span>
        </div>

        <p className="text-dt-text-3 text-sm line-clamp-2 flex-1">{tour.subtitle}</p>

        {/* CTA row */}
        <div className="grid grid-cols-[1fr_auto] gap-2 mt-1">
          <Link
            href={`/excursiones/${tour.slug}`}
            className="text-center bg-dt-dark text-white text-sm font-bold py-2.5 rounded-dt-sm hover:bg-accent transition-colors duration-200"
          >
            Ver experiencia →
          </Link>
          <AddToCartBtn item={cartItem} compact />
        </div>
      </div>
    </article>
  )
}
