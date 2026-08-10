'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/lib/cart-store'

interface Props {
  open: boolean
  onClose: () => void
}

export function CartTray({ open, onClose }: Props) {
  const { items, remove, clear } = useCart()
  const total = items.reduce((s, i) => s + i.priceAdult, 0)

  if (!open) return null

  return (
    <div className="absolute right-0 top-[calc(100%+10px)] w-[340px] z-50 bg-dt-bg border border-dt-border rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
      {/* caret */}
      <div className="absolute -top-[5px] right-4 w-[10px] h-[10px] bg-dt-bg border-l border-t border-dt-border rotate-45" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dt-border">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          <h2 className="font-display font-bold text-dt-text text-sm">Mi selección</h2>
          {items.length > 0 && (
            <span className="text-[11px] text-dt-text-3 bg-dt-bg-2 px-1.5 py-0.5 rounded-full">{items.length}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full border border-dt-border text-dt-text-3 hover:text-dt-text transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Items */}
      <div className="max-h-[300px] overflow-y-auto p-3 flex flex-col gap-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-8 text-center">
            <span className="text-4xl">🏝️</span>
            <p className="font-semibold text-dt-text-2 text-sm">Tu selección está vacía</p>
            <p className="text-xs text-dt-text-3 max-w-[200px]">Explora nuestras excursiones y guarda las que te interesen</p>
            <Link
              href="/excursiones"
              onClick={onClose}
              className="mt-1 bg-accent text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-accent/90 transition-colors"
            >
              Ver excursiones
            </Link>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="flex gap-2.5 bg-dt-surface border border-dt-border rounded-lg p-2.5">
              <div className="relative w-14 h-14 rounded-[8px] overflow-hidden shrink-0 bg-dt-bg-2">
                {item.imageUrl
                  ? <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl">{item.categoryIcon}</div>
                }
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <h4 className="font-display font-bold text-dt-text text-[12px] leading-tight line-clamp-2">{item.name}</h4>
                <p className="text-accent font-bold text-[12px]">desde ${item.priceAdult.toFixed(0)} <span className="text-dt-text-3 font-normal text-[10px]">USD/persona</span></p>
                <div className="flex items-center gap-1.5 mt-auto pt-0.5">
                  <Link
                    href={`/reservar/${item.slug}`}
                    onClick={onClose}
                    className="flex-1 text-center bg-accent text-white text-[11px] font-bold py-1.5 rounded-md hover:bg-accent/90 transition-colors"
                  >
                    Reservar ahora
                  </Link>
                  <button
                    onClick={() => remove(item.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-full border border-dt-border text-dt-text-3 hover:border-red-300 hover:text-red-500 transition-colors shrink-0"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="border-t border-dt-border p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-dt-text-2 font-medium">Total estimado</span>
            <span className="font-display font-bold text-dt-text">${total.toFixed(0)} USD</span>
          </div>
          <p className="text-[11px] text-dt-text-3 mb-3">Solo 20% de anticipo para confirmar cada reserva.</p>
          <div className="flex gap-2">
            <button
              onClick={clear}
              className="border border-dt-border text-dt-text-3 text-xs font-semibold px-3 py-2 rounded-lg hover:border-dt-text-3 transition-colors"
            >
              Vaciar
            </button>
            <Link
              href="/excursiones"
              onClick={onClose}
              className="flex-1 text-center bg-dt-dark text-white text-xs font-bold py-2 rounded-lg hover:bg-accent transition-colors"
            >
              + Agregar más
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
