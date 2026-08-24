export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { fetchApi } from '@/lib/api'
import Link from 'next/link'
import { PrintButton } from '@/components/booking/PrintButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Confirmación de Reserva — Dominicana Tour' }

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

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Pendiente',  color: 'bg-amber-100 text-amber-800 border-amber-300' },
  CONFIRMED: { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  CANCELLED: { label: 'Cancelado',  color: 'bg-red-100 text-red-700 border-red-300' },
}

const PAY_LABELS: Record<string, string> = {
  whatsapp: 'Coordinado por WhatsApp',
  card:     'Tarjeta de crédito',
  paypal:   'PayPal',
  cash:     'Efectivo',
  transfer: 'Transferencia bancaria',
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

  const waNumber  = booking.site?.wa_number ?? '18095550100'
  const tourName  = booking.product?.name   ?? 'Excursión'
  const tourSlug  = booking.product?.slug
  const tourDate  = booking.availability?.date
  const status    = STATUS_MAP[booking.status] ?? STATUS_MAP.PENDING
  const total     = Number(booking.total_amount)
  const deposit   = Number(booking.deposit_amount)
  const balance   = total - deposit
  const pricePerAdult = booking.adults > 0 ? (total / booking.adults) : 0

  const createdAt = booking.created_at
    ? new Date(booking.created_at).toLocaleDateString('es-DO', { dateStyle: 'long' })
    : ''

  const tourDateFmt = tourDate
    ? new Date(tourDate).toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <section className="dt-sec min-h-screen bg-dt-bg">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 print:py-4 print:px-0">

        {/* ── Top success banner (screen only) ── */}
        <div className="flex flex-col items-center text-center mb-8 print:hidden">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-dt-text mb-1">¡Reserva recibida con éxito!</h1>
          <p className="text-dt-text-3 text-sm">Te confirmaremos por email y WhatsApp en menos de 2 horas.</p>
        </div>

        {/* ── Document card ── */}
        <div className="bg-white dark:bg-[#111] border border-dt-border rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)] print:shadow-none print:border print:rounded-none">

          {/* Document header / brand */}
          <div className="bg-[#0A1628] text-white px-8 py-6 print:px-6 print:py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-display font-black tracking-tight">
                  Dominicana<span className="text-orange-400">Tour</span>
                </p>
                <p className="text-white/50 text-xs mt-0.5">Operadora certificada de turismo · Rep. Dominicana</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-1">Código de reserva</p>
                <p className="text-2xl font-mono font-black tracking-widest text-orange-400">{booking.code}</p>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-white/10 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Fecha de emisión</p>
                <p className="text-white font-medium">{createdAt}</p>
              </div>
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Estado</p>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${status.color}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {status.label}
                </span>
              </div>
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Forma de pago</p>
                <p className="text-white font-medium">{PAY_LABELS[booking.payment_method] ?? booking.payment_method}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-7 print:px-6 space-y-7 text-[--dt-text] dark:text-white/90">

            {/* ── Client info ── */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-dt-text-3 mb-3">Pasajero / Cliente</p>
              <p className="text-xl font-bold">
                {booking.first_name}{booking.last_name ? ` ${booking.last_name}` : ''}
              </p>
            </div>

            <div className="border-t border-dt-border" />

            {/* ── Tour info ── */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-dt-text-3 mb-3">Excursión reservada</p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <div className="w-1 h-full min-h-[3rem] bg-orange-400 rounded-full shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-[17px] leading-tight">{tourName}</p>
                    {tourDateFmt && (
                      <p className="text-dt-text-2 text-sm mt-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-orange-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {tourDateFmt}
                      </p>
                    )}
                    <p className="text-dt-text-2 text-sm mt-1 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-orange-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      {booking.adults} adulto{booking.adults !== 1 ? 's' : ''}
                      {booking.children > 0 && ` + ${booking.children} niño${booking.children !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-dt-border" />

            {/* ── Pricing breakdown ── */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-dt-text-3 mb-3">Detalle de pago</p>
              <div className="space-y-2 text-sm">
                {booking.adults > 0 && (
                  <div className="flex justify-between">
                    <span className="text-dt-text-2">{booking.adults} adulto{booking.adults !== 1 ? 's' : ''} × ${pricePerAdult > 0 ? pricePerAdult.toFixed(0) : '—'}</span>
                    <span className="font-semibold">${(booking.adults * pricePerAdult).toFixed(0)} USD</span>
                  </div>
                )}
                {booking.children > 0 && (
                  <div className="flex justify-between">
                    <span className="text-dt-text-2">{booking.children} niño{booking.children !== 1 ? 's' : ''}</span>
                    <span className="font-semibold">incluido</span>
                  </div>
                )}
                <div className="border-t border-dt-border pt-2 mt-2">
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>${total.toFixed(0)} USD</span>
                  </div>
                </div>
              </div>

              {/* Deposit / balance breakdown */}
              <div className="mt-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-dt-text-2">Anticipo requerido (30%)</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">${deposit.toFixed(0)} USD</span>
                </div>
                <div className="w-full bg-orange-200/50 dark:bg-orange-800/20 rounded-full h-1.5">
                  <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${total > 0 ? (deposit/total*100).toFixed(0) : 30}%` }} />
                </div>
                <div className="flex justify-between text-xs text-dt-text-3 mt-2">
                  <span>Saldo restante el día de la excursión</span>
                  <span className="font-semibold">${balance.toFixed(0)} USD</span>
                </div>
              </div>
            </div>

            <div className="border-t border-dt-border" />

            {/* ── Policy note ── */}
            <div className="text-xs text-dt-text-3 space-y-1 leading-relaxed">
              <p>✓ Cancelación gratuita hasta 48 horas antes de la excursión.</p>
              <p>✓ Incluye traslado desde tu hotel en zona de recogida.</p>
              <p>✓ Recibirás confirmación por WhatsApp y email en menos de 2 horas.</p>
            </div>
          </div>

          {/* Footer bar */}
          <div className="border-t border-dt-border bg-dt-bg-2/50 px-8 py-4 print:px-6 print:py-3">
            <p className="text-[10px] text-dt-text-3 text-center">
              Este documento es un comprobante de tu solicitud de reserva. No es válido como voucher hasta recibir confirmación oficial.
            </p>
          </div>
        </div>

        {/* ── Action buttons (screen only) ── */}
        <div className="mt-6 flex flex-col gap-3 print:hidden">
          <a
            href={`https://wa.me/${waNumber}?text=Hola!%20Mi%20código%20de%20reserva%20es%20${booking.code}.%20Quisiera%20confirmar%20mi%20reserva.`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.528 5.854L0 24l6.335-1.652A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.894 0-3.66-.52-5.17-1.424l-.37-.22-3.797.995.995-3.7-.24-.382A9.959 9.959 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Confirmar por WhatsApp
          </a>
          <div className="grid grid-cols-2 gap-3">
            <PrintButton />
            {tourSlug && (
              <Link
                href={`/excursiones/${tourSlug}`}
                className="flex items-center justify-center bg-dt-bg-2 border border-dt-border text-dt-text font-semibold py-3 rounded-xl hover:border-accent transition-colors text-sm"
              >
                Ver excursión
              </Link>
            )}
            {!tourSlug && (
              <Link
                href="/excursiones"
                className="flex items-center justify-center bg-dt-bg-2 border border-dt-border text-dt-text font-semibold py-3 rounded-xl hover:border-accent transition-colors text-sm"
              >
                Más excursiones
              </Link>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}
