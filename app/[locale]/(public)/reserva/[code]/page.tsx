export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { fetchApi } from '@/lib/api'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reserva Confirmada — Dominicana Tour' }

interface Booking {
  code: string
  status: string
  first_name: string
  last_name: string | null
  adults: number
  children: number
  total_amount: number
  deposit_amount: number
  payment_method: string
  product: { name: string; slug: string } | null
  availability: { date: string } | null
  site: { wa_number: string } | null
  created_at: string
}

interface Props {
  params: Promise<{ code: string }>
}

export default async function ConfirmationPage({ params }: Props) {
  const { code } = await params

  let booking: Booking
  try {
    const { data } = await fetchApi<{ data: Booking }>(`/bookings/${code.toUpperCase()}`)
    booking = data
  } catch {
    notFound()
  }

  const waNumber = booking.site?.wa_number ?? '18095550100'
  const tourName = booking.product?.name ?? 'Excursión'
  const tourDate = booking.availability?.date

  return (
    <div className="pt-20 bg-dt-bg-2 min-h-screen">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-black mb-2">¡Reserva recibida!</h1>
        <p className="text-dt-text-2 mb-8">
          Te confirmaremos por email y WhatsApp en menos de 2 horas.
        </p>

        <div className="bg-white border border-dt-border rounded-dt p-6 text-left mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Detalles de tu reserva</h2>
            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full">
              Pendiente de confirmación
            </span>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dt-text-3">Código</span>
              <span className="font-bold text-accent">{booking.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dt-text-3">Nombre</span>
              <span className="font-bold">
                {booking.first_name}
                {booking.last_name ? ` ${booking.last_name}` : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dt-text-3">Excursión</span>
              <span className="font-bold">{tourName}</span>
            </div>
            {tourDate && (
              <div className="flex justify-between">
                <span className="text-dt-text-3">Fecha</span>
                <span>
                  {new Date(tourDate).toLocaleDateString('es-DO', {
                    dateStyle: 'full',
                  })}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-dt-text-3">Personas</span>
              <span>
                {booking.adults} adultos
                {booking.children ? ` + ${booking.children} niños` : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dt-text-3">Total</span>
              <span className="font-bold">${Number(booking.total_amount)} USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dt-text-3">Anticipo</span>
              <span className="font-bold text-accent-2">
                ${Number(booking.deposit_amount)} USD
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={`https://wa.me/${waNumber}`}
            className="w-full bg-accent text-white font-bold py-3 rounded-dt-sm hover:bg-accent/90 transition-colors block"
          >
            💬 Hablar con nosotros por WhatsApp
          </a>
          <Link
            href="/excursiones"
            className="w-full bg-dt-bg-2 border border-dt-border text-dt-text font-semibold py-3 rounded-dt-sm hover:border-accent transition-colors block text-center"
          >
            Ver más excursiones
          </Link>
        </div>
      </div>
    </div>
  )
}
