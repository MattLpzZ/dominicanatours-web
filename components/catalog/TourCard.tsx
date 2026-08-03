import Link from 'next/link'
import Image from 'next/image'
import type { ApiProduct } from '@/components/catalog/ExcursionesClient'

export function TourCard({ tour }: { tour: ApiProduct }) {
  const coverImg = tour.cover_image

  return (
    <Link
      href={`/excursiones/${tour.slug}`}
      className="group block rounded-lg overflow-hidden bg-dt-surface border border-dt-border transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-[5px] hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] hover:border-[var(--color-border-2)]"
    >
      {/* Image — 3:2 */}
      <div className="relative overflow-hidden bg-dt-bg-2" style={{ aspectRatio: '3/2' }}>
        {coverImg ? (
          <Image
            src={coverImg}
            alt={tour.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">
            {tour.category?.icon}
          </div>
        )}
        {tour.featured && (
          <span className="absolute top-2.5 left-2.5 bg-black/55 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-[3px] rounded-full tracking-[0.03em]">
            Top rated
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-dt-text-3 mb-1.5">
          {tour.category?.name}{tour.departure_zone ? ` · ${tour.departure_zone}` : ''}
        </p>
        <h3 className="text-[15px] font-bold text-dt-text leading-[1.3] mb-2.5 line-clamp-2">
          {tour.name}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[13px] font-bold text-dt-text">
            <svg className="w-3 h-3 fill-[#F79009] shrink-0" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            4.9
            <span className="text-dt-text-3 font-normal text-xs">(200+)</span>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-dt-text-3 leading-none mb-0.5">Desde</div>
            <div className="text-[14px] font-extrabold text-accent leading-none">
              ${Number(tour.price_adult).toFixed(0)} USD
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
