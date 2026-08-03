'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useCart, type CartItem } from '@/lib/cart-store'

export function AddToCartBtn({ item, compact = false }: { item: CartItem; compact?: boolean }) {
  const { add, remove, items } = useCart()
  const [added, setAdded] = useState(false)
  const { data: session } = useSession()
  const inCart = items.some(i => i.id === item.id)

  function syncDb(action: 'add' | 'remove') {
    if (!session?.user?.email) return
    if (action === 'add') {
      fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: item.slug, name: item.name, imageUrl: item.imageUrl, priceAdult: item.priceAdult, categoryIcon: item.categoryIcon }),
      }).catch(() => {})
    } else {
      fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: item.slug }),
      }).catch(() => {})
    }
  }

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (inCart) {
      remove(item.id)
      syncDb('remove')
      return
    }
    add(item)
    syncDb('add')
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (compact) {
    return (
      <button
        onClick={handleAdd}
        title={inCart ? 'Quitar de guardados' : 'Guardar'}
        className={`group relative w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200 shrink-0 ${
          inCart
            ? 'bg-red-500/10 border-red-400 text-red-500 hover:bg-red-500/20'
            : added
              ? 'bg-accent border-accent text-white'
              : 'border-dt-border bg-dt-surface text-dt-text-3 hover:border-accent hover:text-accent'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill={inCart || added ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={handleAdd}
      className={`group flex items-center justify-center gap-1.5 w-full text-sm font-bold py-2.5 rounded-dt-sm border transition-all duration-200 ${
        inCart
          ? 'bg-red-500/10 border-red-400 text-red-600 hover:bg-red-500/15'
          : added
            ? 'bg-accent border-accent text-white'
            : 'bg-dt-surface border-dt-border text-dt-text hover:border-accent hover:text-accent'
      }`}
    >
      <svg className="w-4 h-4" fill={inCart || added ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
      </svg>
      {inCart ? 'Guardada' : added ? 'Guardada ✓' : 'Guardar excursión'}
    </button>
  )
}
