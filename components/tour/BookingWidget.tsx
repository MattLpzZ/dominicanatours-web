'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Props {
  slug: string
  priceAdult: number
  priceChild: number
}

export function BookingWidget({ slug, priceAdult, priceChild }: Props) {
  const t = useTranslations('booking')
  const [adults,   setAdults]   = useState(2)
  const [children, setChildren] = useState(0)
  const [date,     setDate]     = useState('')

  const today   = new Date().toISOString().split('T')[0]
  const total   = adults * priceAdult + children * priceChild
  const deposit = Math.ceil(total * 0.3 * 100) / 100

  const reservarHref = date
    ? `/reservar/${slug}?adults=${adults}&children=${children}&date=${date}`
    : `/reservar/${slug}?adults=${adults}&children=${children}`

  return (
    <div className="bg-dt-surface border border-dt-border rounded-dt shadow-dt-md p-6 sticky top-20">
      <div className="mb-1">
        <span className="text-3xl font-black">${priceAdult}</span>
        <span className="text-dt-text-3 text-sm ml-1">{t('priceAdult')}</span>
      </div>
      <p className="text-accent-2 text-xs font-semibold mb-4">{t('cancellation')}</p>

      <div className="flex flex-col gap-3 mb-4">

        {/* Date */}
        <div>
          <label className="text-xs font-semibold text-dt-text-2 mb-1 block">Fecha preferida</label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-dt-border rounded-lg px-3 py-2 text-dt-text bg-dt-bg text-sm focus:outline-none focus:border-accent"
          />
        </div>

        {/* Adults */}
        <div>
          <label className="text-xs font-semibold text-dt-text-2 mb-1 block">{t('adults')}</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAdults(Math.max(1, adults - 1))}
              className="w-8 h-8 rounded-full border border-dt-border font-bold hover:border-accent transition-colors"
            >−</button>
            <span className="font-bold w-4 text-center">{adults}</span>
            <button
              onClick={() => setAdults(adults + 1)}
              className="w-8 h-8 rounded-full border border-dt-border font-bold hover:border-accent transition-colors"
            >+</button>
          </div>
        </div>

        {/* Children */}
        <div>
          <label className="text-xs font-semibold text-dt-text-2 mb-1 block">
            {t('children', { price: priceChild })}
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setChildren(Math.max(0, children - 1))}
              className="w-8 h-8 rounded-full border border-dt-border font-bold hover:border-accent transition-colors"
            >−</button>
            <span className="font-bold w-4 text-center">{children}</span>
            <button
              onClick={() => setChildren(children + 1)}
              className="w-8 h-8 rounded-full border border-dt-border font-bold hover:border-accent transition-colors"
            >+</button>
          </div>
        </div>
      </div>

      <div className="flex justify-between text-sm font-semibold mb-1">
        <span className="text-dt-text-2">{t('total')}</span>
        <span className="text-dt-text">${total} USD</span>
      </div>
      <div className="flex justify-between text-xs text-dt-text-3 mb-4">
        <span>{t('deposit')}</span>
        <span className="font-bold text-accent-2">${deposit} USD</span>
      </div>

      <Link
        href={reservarHref}
        className="block w-full bg-gold text-white text-center font-bold py-3.5 rounded-dt-sm hover:bg-gold/90 transition-colors mb-3"
      >
        {t('bookNow')}
      </Link>
      <a
        href="https://wa.me/18095550100"
        className="flex w-full items-center justify-center gap-2 bg-dt-bg-2 text-dt-text border border-dt-border font-semibold py-3 rounded-dt-sm hover:border-accent transition-colors text-sm"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        {t('whatsapp')}
      </a>
    </div>
  )
}
