import Link from 'next/link'

interface Category {
  slug: string
  icon: string
  name: string
}

type CategoryWithCount = Category & { _count: { tours: number } }

export function CategoryCard({ category }: { category: CategoryWithCount }) {
  return (
    <Link
      href={`/excursiones?cat=${category.slug}`}
      className="relative h-48 rounded-dt overflow-hidden group cursor-pointer block"
    >
      <div className="absolute inset-0 bg-dt-dark/50 group-hover:bg-dt-dark/30 transition-colors z-10" />
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
        <div className="text-2xl mb-1">{category.icon}</div>
        <h4 className="text-white font-bold text-sm">{category.name}</h4>
        <span className="text-white/60 text-xs">{category._count.tours} tours</span>
      </div>
    </Link>
  )
}
