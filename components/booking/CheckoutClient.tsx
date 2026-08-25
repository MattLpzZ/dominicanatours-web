'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import type { ApiProduct } from '@/app/[locale]/(public)/reservar/[slug]/page'

const BASE = process.env.NEXT_PUBLIC_API_URL
  ?? 'https://dominicantour.leymaken.com/api'

interface AvailabilitySlot {
  id: number
  date: string
  spots_left: number
  max_spots: number
}

interface Props {
  product: ApiProduct
  initialAdults: number
  initialChildren: number
  initialDate?: string
}

type PaymentMethod = 'whatsapp' | 'card' | 'paypal'

const STEPS = ['Fecha y grupo', 'Contacto', 'Confirmación']

// ── Price summary (shared between mobile toggle and desktop sidebar) ──
function PriceSummary({
  adults, children, priceAdult, priceChild, total, deposit, couponCode, couponDiscount,
}: {
  adults: number; children: number
  priceAdult: number; priceChild: number
  total: number; deposit: number
  couponCode?: string; couponDiscount?: number
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      {adults > 0 && (
        <div className="flex justify-between">
          <span className="text-dt-text-2">{adults} adulto{adults > 1 ? 's' : ''} × ${priceAdult}</span>
          <span className="font-semibold text-dt-text">${(adults * priceAdult).toFixed(0)}</span>
        </div>
      )}
      {children > 0 && (
        <div className="flex justify-between">
          <span className="text-dt-text-2">{children} niño{children > 1 ? 's' : ''} × ${priceChild}</span>
          <span className="font-semibold text-dt-text">${(children * priceChild).toFixed(0)}</span>
        </div>
      )}
      {couponDiscount && couponDiscount > 0 && (
        <div className="flex justify-between text-emerald-400">
          <span>Cupón {couponCode}</span>
          <span className="font-semibold">-${couponDiscount.toFixed(0)}</span>
        </div>
      )}
      <div className="border-t border-dt-border my-1" />
      <div className="flex justify-between font-bold">
        <span className="text-dt-text">Total</span>
        <span className="text-dt-text text-base">${total.toFixed(0)} USD</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-dt-text-3">Anticipo hoy (30%)</span>
        <span className="font-bold text-accent-2">${deposit.toFixed(0)} USD</span>
      </div>
      <div className="h-1.5 rounded-full bg-dt-bg-2 mt-1 overflow-hidden">
        <div className="h-full w-[30%] rounded-full bg-accent-2" />
      </div>
      <p className="text-[11px] text-dt-text-3">El resto se paga el día de la excursión</p>
    </div>
  )
}

// ── Trust badges ──
const TRUST_ICONS: Record<string, React.ReactElement> = {
  lock: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  phone: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.59 2.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.77-.77a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 17z"/>
    </svg>
  ),
  star: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
}

function TrustBadges() {
  return (
    <div className="flex flex-col gap-2.5 text-xs text-dt-text-2">
      {[
        { icon: 'lock',  text: 'Pago 100% seguro · SSL cifrado' },
        { icon: 'check', text: 'Cancelación gratuita hasta 48h antes' },
        { icon: 'phone', text: 'Soporte 24/7 en español' },
        { icon: 'star',  text: '4.9/5 basado en +820 reseñas' },
      ].map(({ icon, text }) => (
        <div key={text} className="flex items-center gap-2">
          <span className="shrink-0 text-accent">{TRUST_ICONS[icon]}</span>
          <span>{text}</span>
        </div>
      ))}
    </div>
  )
}

// ── Counter widget ──
function Counter({ value, onChange, min = 0, label, sub }: {
  value: number; onChange: (n: number) => void
  min?: number; label: string; sub?: string
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-dt-border last:border-0">
      <div>
        <p className="font-semibold text-dt-text text-sm">{label}</p>
        {sub && <p className="text-xs text-dt-text-3">{sub}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-dt-border font-bold text-lg leading-none flex items-center justify-center hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          −
        </button>
        <span className="font-bold text-base w-4 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border border-dt-border font-bold text-lg leading-none flex items-center justify-center hover:border-accent transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}

// ── Step 1: Date + Pax ──
function Step1({
  adults, setAdults, children, setChildren,
  slots, loadingSlots, selectedSlotId, setSelectedSlotId,
  date, setDate, priceAdult, priceChild,
}: {
  adults: number; setAdults: (n: number) => void
  children: number; setChildren: (n: number) => void
  slots: AvailabilitySlot[]; loadingSlots: boolean
  selectedSlotId: number | null; setSelectedSlotId: (id: number | null) => void
  date: string; setDate: (d: string) => void
  priceAdult: number; priceChild: number
}) {
  const todayStr = new Date().toISOString().split('T')[0]
  const total = adults * priceAdult + children * priceChild

  return (
    <div>
      <h2 className="font-display font-bold text-dt-text text-2xl mb-1">¿Cuándo y cuántos van?</h2>
      <p className="text-dt-text-3 text-sm mb-6">Selecciona la fecha y el número de personas para tu aventura.</p>

      {/* Availability slots or fallback date picker */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-dt-text-2 mb-2">Fecha preferida</label>
        {loadingSlots ? (
          <p className="text-sm text-dt-text-3">Cargando fechas disponibles...</p>
        ) : slots.length > 0 ? (
          <div className="flex flex-col gap-2">
            {slots.map(slot => (
              <label
                key={slot.id}
                className={`flex items-center justify-between p-3 rounded-dt border cursor-pointer transition-all ${
                  selectedSlotId === slot.id
                    ? 'border-accent bg-accent/5'
                    : 'border-dt-border hover:border-dt-text-3 bg-dt-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="availability_slot"
                    value={slot.id}
                    checked={selectedSlotId === slot.id}
                    onChange={() => setSelectedSlotId(slot.id)}
                    className="accent-[#1d70b7]"
                  />
                  <span className="text-sm font-medium text-dt-text">
                    {new Date(slot.date + 'T12:00:00').toLocaleDateString('es-DO', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </span>
                </div>

          {/* Custom date request */}
          <div className="mt-4 pt-4 border-t border-dt-border">
            <p className="text-xs font-semibold text-dt-text-2 mb-2">¿No encuentras tu fecha? Solicita otra:</p>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => { setDate(e.target.value); setSelectedSlotId(null) }}
              className="w-full border border-dt-border rounded-lg px-3 py-2.5 text-dt-text bg-dt-bg text-sm focus:outline-none focus:border-accent"
            />
            {date && !selectedSlotId && (
              <p className="text-xs text-dt-text-3 mt-1.5">Confirmaremos disponibilidad para tu fecha en &lt;2h.</p>
            )}
          </div>
                <span className="text-xs text-dt-text-3">
                  {slot.spots_left} lugar{slot.spots_left !== 1 ? 'es' : ''} disponible{slot.spots_left !== 1 ? 's' : ''}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <>
            <input
              type="date"
              value={date}
              min={todayStr}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-dt-border rounded-dt px-4 py-3 text-dt-text bg-dt-surface focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 text-base"
            />
            <p className="text-xs text-dt-text-3 mt-1.5">Coordinaremos el horario exacto al confirmar tu reserva.</p>
          </>
        )}
      </div>

      {/* Pax */}
      <div className="bg-dt-surface border border-dt-border rounded-dt px-4 mb-6">
        <Counter value={adults} onChange={setAdults} min={1} label="Adultos" sub="+12 años" />
        <Counter value={children} onChange={setChildren} min={0} label="Niños" sub={`−12 años · $${priceChild} c/u`} />
      </div>

      {/* Mini price preview */}
      {total > 0 && (
        <div className="flex items-center justify-between bg-accent/5 border border-accent/20 rounded-dt px-4 py-3">
          <span className="text-sm text-dt-text-2">Total estimado</span>
          <div className="text-right">
            <span className="font-bold text-dt-text text-lg">${total.toFixed(0)} USD</span>
            <span className="text-xs text-accent-2 block">anticipo ${Math.ceil(total * 0.3)} USD</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Step 2: Contact ──
function Step2({
  firstName, setFirstName, lastName, setLastName,
  phone, setPhone, email, setEmail, hotel, setHotel,
  isLoggedIn, forOther, onForOtherChange,
}: {
  firstName: string; setFirstName: (s: string) => void
  lastName: string; setLastName: (s: string) => void
  phone: string; setPhone: (s: string) => void
  email: string; setEmail: (s: string) => void
  hotel: string; setHotel: (s: string) => void
  isLoggedIn: boolean
  forOther: boolean
  onForOtherChange: (v: boolean) => void
}) {
  return (
    <div>
      <h2 className="font-display font-bold text-dt-text text-2xl mb-1">
        {forOther ? 'Datos del participante' : 'Tus datos de contacto'}
      </h2>
      <p className="text-dt-text-3 text-sm mb-4">Te contactaremos por WhatsApp para confirmar los detalles.</p>

      {/* Logged-in banner + "for other" toggle */}
      {isLoggedIn && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-dt border mb-5 ${
          forOther
            ? 'bg-amber-500/5 border-amber-500/20'
            : 'bg-emerald-500/5 border-emerald-500/20'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {forOther ? (
              <svg className="w-4 h-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            )}
            <span className={`text-xs font-medium ${forOther ? 'text-amber-300' : 'text-emerald-400'}`}>
              {forOther
                ? 'Ingresa los datos de quien irá al tour'
                : 'Pre-llenado desde tu cuenta'}
            </span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer shrink-0">
            <span className="text-[11px] text-dt-text-3 whitespace-nowrap">Otra persona</span>
            <button
              type="button"
              onClick={() => onForOtherChange(!forOther)}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${forOther ? 'bg-accent' : 'bg-dt-border'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${forOther ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </label>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-dt-text-2 mb-2">Nombre *</label>
            <input
              type="text"
              placeholder="Pedro"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full border border-dt-border rounded-dt px-4 py-3 text-dt-text bg-dt-surface focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-dt-text-3"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-dt-text-2 mb-2">Apellido *</label>
            <input
              type="text"
              placeholder="Martínez"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full border border-dt-border rounded-dt px-4 py-3 text-dt-text bg-dt-surface focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-dt-text-3"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-dt-text-2 mb-2">WhatsApp *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dt-text-3 text-sm select-none">+1</span>
            <input
              type="tel"
              placeholder="(809) 555-0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full border border-dt-border rounded-dt pl-10 pr-4 py-3 text-dt-text bg-dt-surface focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-dt-text-3"
            />
          </div>
          <p className="text-xs text-dt-text-3 mt-1">Incluye el código de país si no eres de RD.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-dt-text-2 mb-2">
            Email *
          </label>
          <input
            type="email"
            placeholder="pedro@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-dt-border rounded-dt px-4 py-3 text-dt-text bg-dt-surface focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-dt-text-3"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-dt-text-2 mb-2">
            Hotel o zona de hospedaje *
          </label>
          <input
            type="text"
            placeholder="Ej: Hard Rock Punta Cana, zona Bávaro..."
            value={hotel}
            onChange={e => setHotel(e.target.value)}
            className="w-full border border-dt-border rounded-dt px-4 py-3 text-dt-text bg-dt-surface focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-dt-text-3"
          />
          <p className="text-xs text-dt-text-3 mt-1">Nos ayuda a coordinar el punto de recogida.</p>
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Payment + confirm ──
function Step3({
  product, adults, children, date, selectedSlotId, slots,
  firstName, lastName, phone,
  paymentMethod, setPaymentMethod, terms, setTerms, total, deposit,
  appliedCoupon, setAppliedCoupon,
  couponInput, setCouponInput, showCoupon, setShowCoupon,
  couponLoading, couponError, applyCoupon,
}: {
  product: ApiProduct; adults: number; children: number
  date: string; selectedSlotId: number | null; slots: AvailabilitySlot[]
  firstName: string; lastName: string; phone: string
  paymentMethod: PaymentMethod; setPaymentMethod: (m: PaymentMethod) => void
  terms: boolean; setTerms: (b: boolean) => void
  total: number; deposit: number
  appliedCoupon: { code: string; description: string | null; discountAmount: number } | null
  setAppliedCoupon: (c: { code: string; description: string | null; discountAmount: number } | null) => void
  couponInput: string; setCouponInput: (s: string) => void
  showCoupon: boolean; setShowCoupon: (b: boolean | ((s: boolean) => boolean)) => void
  couponLoading: boolean; couponError: string; applyCoupon: () => Promise<void>
}) {
  const selectedSlot = slots.find(s => s.id === selectedSlotId)
  const dateLabel = selectedSlot
    ? new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })
    : date
      ? new Date(date + 'T12:00:00').toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'Sin fecha'

  const METHODS: { id: PaymentMethod; icon: string; label: string; desc: string }[] = [
    { id: 'whatsapp', icon: '💬', label: 'WhatsApp', desc: 'Coordinamos el pago directamente — la opción más rápida' },
    { id: 'card',     icon: '💳', label: 'Tarjeta',  desc: 'Crédito o débito (Visa, Mastercard, Amex)' },
    { id: 'paypal',   icon: '🅿️', label: 'PayPal',   desc: 'Pago seguro con tu cuenta PayPal' },
  ]

  return (
    <div>
      <h2 className="font-display font-bold text-dt-text text-2xl mb-1">Confirma tu reserva</h2>
      <p className="text-dt-text-3 text-sm mb-6">Un último paso — revisa el resumen y elige cómo prefieres pagar.</p>

      {/* Summary card */}
      <div className="bg-dt-surface border border-dt-border rounded-dt p-4 mb-6">
        <p className="text-xs font-bold text-dt-text-3 uppercase tracking-wide mb-3">Resumen</p>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-dt-text-2">Excursión</span>
            <span className="font-semibold text-dt-text text-right max-w-[55%]">{product.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dt-text-2">Fecha</span>
            <span className="font-semibold text-dt-text capitalize">{dateLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dt-text-2">Grupo</span>
            <span className="font-semibold text-dt-text">
              {adults} adulto{adults > 1 ? 's' : ''}{children > 0 ? ` · ${children} niño${children > 1 ? 's' : ''}` : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-dt-text-2">Nombre</span>
            <span className="font-semibold text-dt-text">{firstName ? `${firstName} ${lastName}`.trim() : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dt-text-2">WhatsApp</span>
            <span className="font-semibold text-dt-text">{phone || '—'}</span>
          </div>
          <div className="border-t border-dt-border my-1" />
          <div className="flex justify-between font-bold">
            <span className="text-dt-text">Total</span>
            <span className="text-dt-text">${total.toFixed(0)} USD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-accent-2 font-semibold">Anticipo hoy</span>
            <span className="text-accent-2 font-bold">${deposit.toFixed(0)} USD</span>
          </div>
        </div>
      </div>

      {/* Coupon */}
      <div className="mb-6">
        {!appliedCoupon ? (
          <>
            <button
              type="button"
              onClick={() => setShowCoupon(s => !s)}
              className="flex items-center gap-1.5 text-sm text-accent hover:underline"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
              </svg>
              {showCoupon ? 'Cancelar' : 'Tengo un cupón de descuento'}
            </button>
            {showCoupon && (
              <div className="mt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                    placeholder="CÓDIGO"
                    className="flex-1 border border-dt-border rounded-dt px-3 py-2 text-dt-text bg-dt-surface text-sm font-mono tracking-wider focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-4 py-2 bg-accent text-white rounded-dt text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {couponLoading ? '...' : 'Aplicar'}
                  </button>
                </div>
                {couponError && <p className="text-red-400 text-xs mt-1">{couponError}</p>}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-dt">
            <div>
              <p className="text-emerald-400 text-sm font-bold font-mono">{appliedCoupon.code}</p>
              {appliedCoupon.description && <p className="text-dt-text-3 text-xs">{appliedCoupon.description}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-bold">-${appliedCoupon.discountAmount.toFixed(0)}</span>
              <button type="button" onClick={() => setAppliedCoupon(null)} className="text-dt-text-3 hover:text-red-400 transition-colors text-lg leading-none">×</button>
            </div>
          </div>
        )}
      </div>

      {/* Payment method */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-dt-text-2 mb-3">Método de pago preferido</p>
        <div className="flex flex-col gap-2">
          {METHODS.map(m => (
            <label
              key={m.id}
              className={`flex items-center gap-3 p-3.5 rounded-dt border cursor-pointer transition-all ${
                paymentMethod === m.id
                  ? 'border-accent bg-accent/5'
                  : 'border-dt-border hover:border-dt-text-3 bg-dt-surface'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value={m.id}
                checked={paymentMethod === m.id}
                onChange={() => setPaymentMethod(m.id)}
                className="accent-[#1d70b7]"
              />
              <span className="text-lg">{m.icon}</span>
              <div>
                <p className={`text-sm font-semibold ${paymentMethod === m.id ? 'text-accent' : 'text-dt-text'}`}>{m.label}</p>
                <p className="text-xs text-dt-text-3">{m.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={terms}
          onChange={e => setTerms(e.target.checked)}
          className="mt-0.5 accent-[#1d70b7] w-4 h-4 shrink-0"
        />
        <span className="text-xs text-dt-text-2 leading-relaxed">
          He leído y acepto los{' '}
          <Link href="/terminos" target="_blank" className="text-accent hover:underline">Términos y Condiciones</Link>
          {' '}y la{' '}
          <Link href="/privacidad" target="_blank" className="text-accent hover:underline">Política de Privacidad</Link>
          . Entiendo que solo se cobra el 30% de anticipo ahora y el resto el día de la excursión.
        </span>
      </label>
    </div>
  )
}

// ── Main checkout component ──
export function CheckoutClient({ product, initialAdults, initialChildren, initialDate }: Props) {
  const { data: session } = useSession()

  const [step, setStep]       = useState<1 | 2 | 3>(initialDate ? 2 : 1)
  const [animKey, setAnimKey] = useState(0)
  const [animDir, setAnimDir] = useState<'fwd' | 'bck'>('fwd')

  const [adults,   setAdults]   = useState(initialAdults)
  const [children, setChildren] = useState(initialChildren)
  const [date,     setDate]     = useState(initialDate ?? '')
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null)
  const [slots,    setSlots]    = useState<AvailabilitySlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(true)

  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [phone,    setPhone]    = useState('')
  const [email,    setEmail]    = useState('')
  const [hotel,    setHotel]    = useState('')

  // "For another person" toggle — when true, user manually fills contact fields
  const [forOther, setForOther]     = useState(false)
  const [sessionFirst, setSessionFirst] = useState('')
  const [sessionLast,  setSessionLast]  = useState('')
  const [sessionEmail, setSessionEmail] = useState('')

  // Pre-fill from session once loaded
  useEffect(() => {
    if (!session?.user) return
    const parts = (session.user.name ?? '').trim().split(' ')
    const first = parts[0] ?? ''
    const last  = parts.slice(1).join(' ')
    const mail  = session.user.email ?? ''
    setSessionFirst(first)
    setSessionLast(last)
    setSessionEmail(mail)
    if (!forOther) {
      setFirstName(prev => prev || first)
      setLastName(prev  => prev || last)
      setEmail(prev     => prev || mail)
    }
  }, [session])

  function handleForOther(checked: boolean) {
    setForOther(checked)
    if (checked) {
      setFirstName(''); setLastName(''); setEmail('')
    } else {
      setFirstName(sessionFirst); setLastName(sessionLast); setEmail(sessionEmail)
    }
  }
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('whatsapp')
  const [terms,    setTerms]    = useState(false)
  const [error,    setError]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [showCoupon, setShowCoupon] = useState(false)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; description: string | null; discountAmount: number } | null>(null)

  const priceAdult = Number(product.price_adult)
  const priceChild = Number(product.price_child)
  const rawTotal    = adults * priceAdult + children * priceChild
  const couponDiscount = appliedCoupon?.discountAmount ?? 0
  const total   = Math.max(0, rawTotal - couponDiscount)
  const deposit = Math.ceil(total * 0.3 * 100) / 100

  async function applyCoupon() {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), amount: rawTotal }),
      })
      const data = await res.json()
      if (!data.valid) { setCouponError(data.error ?? 'Código no válido') }
      else { setAppliedCoupon({ code: data.coupon.code, description: data.coupon.description, discountAmount: data.coupon.discountAmount }); setShowCoupon(false); setCouponInput('') }
    } catch { setCouponError('Error al validar') }
    setCouponLoading(false)
  }

  // Load availability slots on mount
  useEffect(() => {
    fetch(`${BASE}/availability/${product.id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(({ data }) => setSlots(Array.isArray(data) ? data : []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [product.id])

  function goNext() {
    if (step === 1) {
      if (slots.length > 0 && selectedSlotId === null) {
        setError('Selecciona una fecha disponible para continuar')
        return
      }
      if (slots.length === 0 && !date) {
        setError('Selecciona una fecha para continuar')
        return
      }
      if (adults === 0) { setError('Agrega al menos 1 adulto'); return }
    }
    if (step === 2) {
      if (!firstName.trim()) { setError('Ingresa tu nombre'); return }
      if (!lastName.trim())  { setError('Ingresa tu apellido'); return }
      if (!phone.trim())     { setError('Ingresa tu número de WhatsApp'); return }
      if (!email.trim())     { setError('Ingresa tu email — lo necesitamos para enviarte la confirmación'); return }
      if (!hotel.trim())     { setError('Ingresa tu hotel o zona de hospedaje — lo necesitamos para coordinar la recogida'); return }
    }
    setError('')
    setAnimDir('fwd')
    setAnimKey(k => k + 1)
    setStep(s => (s + 1) as 1 | 2 | 3)
  }

  function goBack() {
    setError('')
    setAnimDir('bck')
    setAnimKey(k => k + 1)
    setStep(s => (s - 1) as 1 | 2 | 3)
  }

  async function handleSubmit() {
    if (!terms) { setError('Acepta los términos y condiciones para continuar'); return }
    setSubmitting(true)
    setError('')

    const bookingPayload = {
      product_id:      product.id,
      product_name:    product.name,
      availability_id: selectedSlotId ?? null,
      first_name:      firstName.trim(),
      last_name:       lastName.trim(),
      email:           email.trim(),
      phone:           phone.trim(),
      hotel:           hotel.trim(),
      adults,
      children,
      payment_method:  paymentMethod,
      notes:           appliedCoupon ? `Cupón: ${appliedCoupon.code}` : null,
      coupon_code:     appliedCoupon?.code ?? null,
    }

    // PayPal: redirect to PayPal approval before creating booking
    if (paymentMethod === 'paypal' && deposit > 0) {
      try {
        const res = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingData: bookingPayload, depositAmount: deposit }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Error al iniciar el pago con PayPal. Intenta de nuevo.')
          setSubmitting(false)
          return
        }
        if (!data.approvalUrl) {
          setError('No se recibió la URL de pago de PayPal.')
          setSubmitting(false)
          return
        }
        window.location.href = data.approvalUrl
      } catch {
        setError('Error de conexión con PayPal. Intenta de nuevo.')
        setSubmitting(false)
      }
      return
    }

    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? json.error ?? 'Error al procesar la reserva. Intenta de nuevo.')
        setSubmitting(false)
        return
      }
      const booking = json.data ?? json
      window.location.href = `/reserva/${booking.code}`
    } catch {
      setError('Error de conexión. Por favor intenta de nuevo.')
      setSubmitting(false)
    }
  }

  const img = product.images?.[0]

  return (
    <div className="min-h-screen bg-dt-bg">

      {/* ── Checkout navbar ── */}
      <header className="sticky top-0 z-40 bg-dt-surface/95 backdrop-blur-sm border-b border-dt-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href={`/excursiones/${product.slug}`}
            className="flex items-center gap-1.5 text-sm text-dt-text-2 hover:text-accent transition-colors min-w-0"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="truncate">{product.name}</span>
          </Link>
          <Link href="/" className="shrink-0">
            <Image src="/logo.svg" alt="Dominicana Tour" width={130} height={36} className="h-7 w-auto" />
          </Link>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-dt-text-3 shrink-0">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            Reserva segura
          </div>
        </div>
      </header>

      {/* ── Mobile order summary toggle ── */}
      <div className="lg:hidden bg-dt-surface border-b border-dt-border">
        <button
          onClick={() => setSummaryOpen(o => !o)}
          className="w-full px-4 py-3 flex items-center justify-between"
        >
          <span className="flex items-center gap-2 text-sm text-dt-text-2 min-w-0">
            <span className="text-base shrink-0">{product.category.icon}</span>
            <span className="font-medium truncate">{product.name}</span>
          </span>
          <span className="flex items-center gap-1.5 font-bold text-dt-text text-sm shrink-0 ml-2">
            ${total.toFixed(0)} USD
            <svg className={`w-4 h-4 text-dt-text-3 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </span>
        </button>
        {summaryOpen && (
          <div className="px-4 pb-4 border-t border-dt-border pt-3">
            <PriceSummary adults={adults} children={children} priceAdult={priceAdult} priceChild={priceChild} total={total} deposit={deposit} couponCode={appliedCoupon?.code} couponDiscount={couponDiscount} />
          </div>
        )}
      </div>

      {/* ── Main body ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:grid lg:grid-cols-[1fr_380px] lg:gap-12 lg:items-start">

        {/* ── Left: form ── */}
        <div>

          {/* Progress steps */}
          <nav className="flex items-center gap-0 mb-8">
            {STEPS.map((label, i) => {
              const num = i + 1
              const done   = step > num
              const active = step === num
              return (
                <div key={num} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200 ${
                      done   ? 'bg-accent border-accent text-white' :
                      active ? 'bg-dt-surface border-accent text-accent' :
                               'bg-dt-surface border-dt-border text-dt-text-3'
                    }`}>
                      {done ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      ) : num}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block transition-colors ${
                      done ? 'text-accent' : active ? 'text-dt-text' : 'text-dt-text-3'
                    }`}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-2 sm:mx-3 transition-colors duration-300 ${done ? 'bg-accent' : 'bg-dt-border'}`} />
                  )}
                </div>
              )
            })}
          </nav>

          {/* Animated step content */}
          <div
            key={animKey}
            className={animDir === 'fwd' ? 'bd-step-fwd' : 'bd-step-bck'}
          >
            {step === 1 && (
              <Step1
                adults={adults} setAdults={setAdults}
                children={children} setChildren={setChildren}
                slots={slots} loadingSlots={loadingSlots}
                selectedSlotId={selectedSlotId} setSelectedSlotId={setSelectedSlotId}
                date={date} setDate={setDate}
                priceAdult={priceAdult} priceChild={priceChild}
              />
            )}
            {step === 2 && (
              <Step2
                firstName={firstName} setFirstName={setFirstName}
                lastName={lastName}   setLastName={setLastName}
                phone={phone} setPhone={setPhone}
                email={email} setEmail={setEmail}
                hotel={hotel} setHotel={setHotel}
                isLoggedIn={!!session?.user}
                forOther={forOther}
                onForOtherChange={handleForOther}
              />
            )}
            {step === 3 && (
              <Step3
                product={product}
                adults={adults} children={children}
                date={date} selectedSlotId={selectedSlotId} slots={slots}
                firstName={firstName} lastName={lastName} phone={phone}
                paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                terms={terms} setTerms={setTerms}
                total={total} deposit={deposit}
                appliedCoupon={appliedCoupon} setAppliedCoupon={setAppliedCoupon}
                couponInput={couponInput} setCouponInput={setCouponInput}
                showCoupon={showCoupon} setShowCoupon={setShowCoupon}
                couponLoading={couponLoading} couponError={couponError} applyCoupon={applyCoupon}
              />
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-dt text-red-700 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              {error}
            </div>
          )}

          {/* Navigation actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-dt-border">
            {step > 1 ? (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 text-sm font-medium text-dt-text-2 hover:text-dt-text transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
                Atrás
              </button>
            ) : (
              <Link
                href={`/excursiones/${product.slug}`}
                className="text-sm text-dt-text-3 hover:text-dt-text-2 transition-colors"
              >
                Cancelar
              </Link>
            )}

            {step < 3 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-2 bg-accent text-white font-bold px-7 py-3 rounded-dt hover:bg-accent/90 active:scale-95 transition-all text-sm"
              >
                Continuar
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 bg-accent text-white font-bold px-7 py-3 rounded-dt hover:bg-accent/90 active:scale-95 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>
                    Confirmar reserva
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Right: sticky order summary (desktop only) ── */}
        <div className="hidden lg:block">
          <div className="sticky top-20 flex flex-col gap-4">

            {/* Product card */}
            <div className="bg-dt-surface border border-dt-border rounded-dt overflow-hidden">
              <div className="relative h-48">
                {img ? (
                  <Image src={img.url} alt={img.alt} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-dt-bg-2 flex items-center justify-center text-6xl">
                    {product.category.icon}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <span className="text-white/80 text-xs">★★★★★ 4.9</span>
                  <span className="bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    desde ${priceAdult} USD
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-accent-2 mb-1">{product.category.icon} {product.category.name}</p>
                <h3 className="font-display font-bold text-dt-text text-base leading-tight mb-2">{product.name}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {product.departure_zone && (
                    <span className="text-xs bg-dt-bg-2 border border-dt-border rounded-full px-2.5 py-0.5 text-dt-text-2">
                      📍 {product.departure_zone}
                    </span>
                  )}
                  <span className="text-xs bg-dt-bg-2 border border-dt-border rounded-full px-2.5 py-0.5 text-dt-text-2">
                    ⏱️ {product.duration}
                  </span>
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-dt-surface border border-dt-border rounded-dt p-4">
              <p className="text-xs font-bold text-dt-text-3 uppercase tracking-wide mb-3">Resumen del pedido</p>
              <PriceSummary
                adults={adults} children={children}
                priceAdult={priceAdult} priceChild={priceChild}
                total={total} deposit={deposit}
                couponCode={appliedCoupon?.code}
                couponDiscount={couponDiscount}
              />
            </div>

            {/* Trust badges */}
            <div className="bg-dt-surface border border-dt-border rounded-dt p-4">
              <TrustBadges />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
