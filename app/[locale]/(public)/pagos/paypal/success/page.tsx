'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function PaypalSuccessPage() {
  const params = useSearchParams()
  const token = params.get('token')
  const PayerID = params.get('PayerID')
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setError('Token de pago no encontrado'); return }
    fetch('/api/paypal/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, PayerID }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) { setCode(data.booking?.code ?? ''); setStatus('ok') }
        else { setError(data.error ?? 'Error al procesar el pago'); setStatus('error') }
      })
      .catch(() => { setError('Error de conexión'); setStatus('error') })
  }, [token, PayerID])

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-dt-bg">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-dt-text-2 text-sm">Confirmando tu pago con PayPal...</p>
      </div>
    </div>
  )

  if (status === 'error') return (
    <div className="min-h-screen flex items-center justify-center bg-dt-bg px-4">
      <div className="max-w-sm w-full bg-dt-surface border border-red-200 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </div>
        <h1 className="font-bold text-dt-text text-lg mb-2">Error al procesar el pago</h1>
        <p className="text-dt-text-2 text-sm mb-6">{error}</p>
        <Link href="/excursiones" className="inline-block bg-accent text-white font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-accent/90 transition-colors">
          Volver a excursiones
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-dt-bg px-4">
      <div className="max-w-sm w-full bg-dt-surface border border-dt-border rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 className="font-bold text-dt-text text-xl mb-2">Pago confirmado</h1>
        <p className="text-dt-text-2 text-sm mb-6">Tu reserva fue creada exitosamente con PayPal.</p>
        {code && (
          <Link href={`/reserva/${code}`} className="inline-block bg-accent text-white font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-accent/90 transition-colors">
            Ver mi reserva →
          </Link>
        )}
      </div>
    </div>
  )
}
