'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
interface TourCard {
  slug: string
  name: string
  priceAdult: number
  duration: string
  categoryIcon: string
  imageUrl: string | null
}

interface ReservationCard {
  code: string
  status: string
  statusLabel: string
  tourName: string
  tourSlug: string
  date: string
  adults: number
  children: number
  total: number
  deposit: number
  paidDeposit: boolean
}

interface Message {
  role: 'bot' | 'user'
  text: string
  suggestions?: string[]
  escalate?: boolean
  whatsappUrl?: string
  tours?: TourCard[]
  reservation?: ReservationCard
}

const WELCOME: Message = {
  role: 'bot',
  text: '¡Hola! 🌴 Bienvenido a **Dominicana Tour**. Soy tu asistente virtual — pregúntame sobre excursiones, precios o el estado de tu reserva.',
  suggestions: ['Ver precios', 'Consultar mi reserva', 'Tours para niños', 'Transporte'],
}

// ── Markdown-lite renderer ────────────────────────────────────────────────────
function renderText(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

// ── Sub-components ────────────────────────────────────────────────────────────
function TourMiniCard({ tour }: { tour: TourCard }) {
  return (
    <Link
      href={`/excursiones/${tour.slug}`}
      className="flex items-center gap-2.5 p-2.5 bg-white border border-dt-border rounded-xl hover:border-accent transition-colors group"
    >
      <div className="w-10 h-10 rounded-lg bg-dt-bg-2 shrink-0 overflow-hidden flex items-center justify-center text-xl">
        {tour.imageUrl ? (
          <img src={tour.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>{tour.categoryIcon}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-dt-text truncate group-hover:text-accent transition-colors">{tour.name}</p>
        <p className="text-[11px] text-dt-text-3">desde <span className="font-bold text-accent">${Math.floor(tour.priceAdult)}</span> · {tour.duration}</p>
      </div>
      <svg className="w-3.5 h-3.5 text-dt-text-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
      </svg>
    </Link>
  )
}

function ResvCard({ r }: { r: ReservationCard }) {
  const statusColor: Record<string, string> = {
    PENDING:   'bg-amber-50 border-amber-200 text-amber-700',
    CONFIRMED: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    COMPLETED: 'bg-blue-50 border-blue-200 text-blue-700',
    CANCELLED: 'bg-red-50 border-red-200 text-red-700',
  }
  const colorClass = statusColor[r.status] ?? 'bg-gray-50 border-gray-200 text-gray-700'
  const pax = r.children > 0
    ? `${r.adults} adulto${r.adults !== 1 ? 's' : ''} · ${r.children} niño${r.children !== 1 ? 's' : ''}`
    : `${r.adults} adulto${r.adults !== 1 ? 's' : ''}`

  return (
    <div className="w-full rounded-xl border border-dt-border bg-white overflow-hidden shadow-sm">
      <div className="px-3 py-2 bg-dt-dark/5 border-b border-dt-border flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-dt-text">{r.code}</span>
        <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border', colorClass)}>
          {r.statusLabel}
        </span>
      </div>
      <div className="px-3 py-2.5 space-y-1.5 text-xs">
        <p className="font-semibold text-dt-text leading-tight">{r.tourName}</p>
        <div className="flex items-center gap-1 text-dt-text-3">
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span className="capitalize">{r.date}</span>
        </div>
        <div className="flex items-center gap-1 text-dt-text-3">
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <span>{pax}</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-dt-border">
          <span className="text-dt-text-3">Total</span>
          <span className="font-bold text-dt-text">${Math.floor(r.total)} USD</span>
        </div>
      </div>
      <div className="px-3 pb-2.5">
        <Link
          href={`/reserva/${r.code}`}
          className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-accent/10 hover:bg-accent text-accent hover:text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Ver detalles completos
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function ChatWidget() {
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [unread,   setUnread]   = useState(0)
  const [sessionId, setSessionId] = useState<string>('')

  const endRef   = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Persist sessionId in localStorage
  useEffect(() => {
    let sid = localStorage.getItem('dt_chat_session')
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('dt_chat_session', sid)
    }
    setSessionId(sid)
  }, [])

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
        inputRef.current?.focus()
      }, 80)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  async function send(text: string) {
    if (!text.trim() || loading) return
    setMessages(prev => [...prev, { role: 'user', text: text.trim() }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), sessionId }),
      })
      const data = await res.json()
      const botMsg: Message = {
        role: 'bot',
        text: data.message ?? '',
        suggestions: data.suggestions,
        escalate: data.escalate,
        whatsappUrl: data.whatsappUrl,
        tours: data.tours,
        reservation: data.reservation,
      }
      setMessages(prev => [...prev, botMsg])
      if (!open) setUnread(n => n + 1)
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'Ups, algo falló. Escríbenos por WhatsApp.',
        escalate: true,
        whatsappUrl: 'https://wa.me/18095550100',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Floating button ────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Chat con soporte"
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-[0_4px_20px_rgba(0,0,0,.25)] flex items-center justify-center transition-all duration-300',
          open
            ? 'bg-[#0A1628] scale-95'
            : 'bg-[#1d70b7] hover:scale-110 hover:shadow-[0_4px_24px_rgba(232,93,32,.5)]',
        )}
      >
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
        {open ? (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        ) : (
          <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
            <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/>
          </svg>
        )}
      </button>

      {/* ── Chat panel ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed bottom-24 right-6 z-50 w-[22rem] sm:w-96 bg-[#F2F4F7] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,.18)] border border-[#EAECF0] flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right',
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none',
        )}
        style={{ maxHeight: '72vh' }}
      >
        {/* Header */}
        <div className="bg-[#0A1628] text-white px-4 py-3 flex items-center gap-3 shrink-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#1d70b7] flex items-center justify-center text-base">🌴</div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#E8B94F] border-2 border-[#0A1628]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight">Dominicana Tour</p>
            <p className="text-white/50 text-[11px]">Asistente virtual · En línea ahora</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white/80 transition-colors p-1">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {messages.map((m, i) => (
            <div key={i} className={cn('flex flex-col gap-2', m.role === 'user' ? 'items-end' : 'items-start')}>

              {/* Bubble */}
              <div
                className={cn(
                  'max-w-[88%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-[#1d70b7] text-white rounded-br-sm'
                    : 'bg-white text-[#101828] border border-[#EAECF0] rounded-bl-sm shadow-sm',
                )}
                dangerouslySetInnerHTML={{ __html: renderText(m.text) }}
              />

              {/* Reservation card */}
              {m.reservation && (
                <div className="w-full max-w-[92%]">
                  <ResvCard r={m.reservation} />
                </div>
              )}

              {/* Tour cards */}
              {m.tours && m.tours.length > 0 && (
                <div className="w-full max-w-[92%] flex flex-col gap-1.5">
                  {m.tours.slice(0, 3).map(t => (
                    <TourMiniCard key={t.slug} tour={t} />
                  ))}
                  {m.tours.length > 3 && (
                    <Link href="/excursiones" className="text-center text-xs text-[#1d70b7] hover:underline py-0.5">
                      Ver todas las excursiones →
                    </Link>
                  )}
                </div>
              )}

              {/* Suggestions */}
              {m.suggestions && m.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-w-[95%]">
                  {m.suggestions.map((s, si) => (
                    <button
                      key={si}
                      onClick={() => send(s)}
                      className="text-xs bg-white border border-[#1d70b7]/30 text-[#1d70b7] px-2.5 py-1 rounded-full hover:bg-[#1d70b7] hover:text-white transition-colors font-medium"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* WA escalation button */}
              {m.escalate && m.whatsappUrl && (
                <a
                  href={m.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#25D366] text-white text-xs font-bold px-3.5 py-2 rounded-full hover:bg-[#1db954] transition-colors shadow-sm"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Continuar por WhatsApp
                </a>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-start">
              <div className="bg-white border border-[#EAECF0] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#667085] inline-block animate-bounce"
                    style={{ animationDelay: `${i * 0.14}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={e => { e.preventDefault(); send(input) }}
          className="flex items-center gap-2 px-3 py-2.5 border-t border-[#EAECF0] bg-white shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            disabled={loading}
            className="flex-1 text-sm border border-[#EAECF0] rounded-full px-4 py-2 focus:outline-none focus:border-[#1d70b7] text-[#101828] placeholder:text-[#667085] disabled:opacity-50 transition-colors bg-[#F9FAFB]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-full bg-[#1d70b7] hover:bg-[#1d70b7]/90 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
            </svg>
          </button>
        </form>

        {/* Footer note */}
        <p className="text-center text-[10px] text-[#667085] py-1.5 bg-white border-t border-[#EAECF0]">
          Asistente virtual · Para urgencias usa{' '}
          <a href="https://wa.me/18095550100" target="_blank" rel="noopener noreferrer" className="text-[#25D366] font-semibold hover:underline">
            WhatsApp
          </a>
        </p>
      </div>
    </>
  )
}
