import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: number
  slug: string
  name: string
  priceAdult: number
  imageUrl: string | null
  categoryIcon: string
}

interface CartState {
  items: CartItem[]
  add: (item: CartItem) => void
  remove: (id: number) => void
  clear: () => void
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        if (get().items.find(i => i.id === item.id)) return
        set(s => ({ items: [...s.items, item] }))
      },
      remove: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'dt-cart' },
  ),
)
