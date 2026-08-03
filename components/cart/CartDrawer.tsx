'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/lib/cart-store'

interface Props {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: Props) {
  const { items, remove, clear } = useCart()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      document.body.classList.add('cart-open')
    } else {
      document.body.style.overflow = ''
      document.body.classList.remove('cart-open')
    }
    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('cart-open')
    }
  }, [open])

  const total = items.reduce((s, i) => s + i.priceAdult, 0)

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 z-50 bg-dt-bg flex flex-col shadow-dt-lg border-l border-dt-border transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dt-border shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🛒</span>
            <div>
              <h2 className="font-display font-bold text-dt-text text-lg leading-tight">Mi selección</h2>
              <p className="text-xs text-dt-text-3">{items.length} excursión{items.length !== 1 ? 'es' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-dt-border flex items-center justify-center text-dt-text-3 hover:text-dt-text hover:border-dt-text-3 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-dt-text-3 py-16">
              <span className="text-5xl">🏝️</span>
              <p className="font-semibold text-dt-text-2">Tu selección está vacía</p>
              <p className="text-sm text-center">Explora nuestras excursiones y agrega las que te interesen</p>
              <Link
                href="/excursiones"
                onClick={onClose}
                className="mt-2 bg-accent text-white text-sm font-bold px-5 py-2.5 rounded-dt-sm hover:bg-accent/90 transition-colors"
              >
                Ver excursiones
              </Link>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-3 bg-dt-surface border border-dt-border rounded-dt p-3 group">
                {/* Thumbnail */}
                <div className="relative w-20 h-20 rounded-[10px] overflow-hidden shrink-0 bg-dt-bg-2">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">{item.categoryIcon}</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <h4 className="font-display font-bold text-dt-text text-sm leading-tight line-clamp-2">{item.name}</h4>
                  <p className="text-accent font-bold text-sm">desde ${item.priceAdult.toFixed(0)} USD <span className="text-dt-text-3 font-normal text-xs">/persona</span></p>
                  <div className="flex items-center gap-2 mt-auto">
                    <Link
                      href={`/reservar/${item.slug}`}
                      onClick={onClose}
                      className="flex-1 text-center bg-accent text-white text-xs font-bold py-2 rounded-dt-sm hover:bg-accent/90 transition-colors"
                    >
                      Reservar
                    </Link>
                    <button
                      onClick={() => remove(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-full border border-dt-border text-dt-text-3 hover:border-red-300 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
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
          <div className="border-t border-dt-border p-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-dt-text-2 font-medium">Total estimado</span>
              <span className="font-display font-bold text-dt-text text-lg">${total.toFixed(0)} USD</span>
            </div>
            <p className="text-xs text-dt-text-3 mb-4">Solo 20% de anticipo para confirmar cada reserva.</p>
            <div className="flex gap-2">
              <button
                onClick={clear}
                className="flex-none border border-dt-border text-dt-text-3 text-xs font-semibold px-3 py-2.5 rounded-dt-sm hover:border-dt-text-3 transition-colors"
              >
                Vaciar
              </button>
              <Link
                href="/excursiones"
                onClick={onClose}
                className="flex-1 text-center bg-dt-dark text-white text-sm font-bold py-2.5 rounded-dt-sm hover:bg-accent transition-colors"
              >
                + Agregar más
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
