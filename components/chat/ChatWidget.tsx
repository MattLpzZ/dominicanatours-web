'use client'
import { useState, useRef, useEffect, useId } from 'react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'bot' | 'user'
  text: string
  suggestions?: string[]
  escalate?: boolean
  whatsappUrl?: string
}

const WELCOME: Message = {
  role: 'bot',
  text: '¡Hola! 👋 Soy el asistente de Dominicana Tour. Puedo ayudarte con información sobre excursiones, precios y reservas. ¿En qué puedo ayudarte?',
  suggestions: ['Ver excursiones de playa', 'Precios y disponibilidad', 'Hacer una reserva'],
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const sessionId = useId()
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open, messages])

  async function send(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), sessionId }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'bot',
        text: data.message,
        suggestions: data.suggestions,
        escalate: data.escalate,
        whatsappUrl: data.whatsappUrl,
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'Ups, algo falló. Escríbenos directamente por WhatsApp.',
        escalate: true,
        whatsappUrl: 'https://wa.me/18095550100',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Chat con Dominicana Tour"
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-dt-lg flex items-center justify-center transition-all duration-300 chat-float',
          open ? 'bg-dt-dark rotate-90 scale-95' : 'bg-accent hover:scale-110 animate-wa-pulse',
        )}
      >
        {open ? (
          <svg className="w-6 h-6 text-white fill-white" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/></svg>
        ) : (
          <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
        )}
      </button>

      {/* Chat modal */}
      <div
        className={cn(
          'fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-dt shadow-dt-lg border border-dt-border transition-all duration-300 flex flex-col overflow-hidden',
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none',
        )}
        style={{ maxHeight: '70vh' }}
      >
        {/* Header */}
        <div className="bg-dt-dark text-white px-4 py-3 flex items-center gap-3 shrink-0">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-lg">🌴</div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent-2 border-2 border-dt-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-sm">Dominicana Tour</div>
            <div className="text-white/50 text-xs">Asistente virtual · Responde al instante</div>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white p-1">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 bg-dt-bg">
          {messages.map((m, i) => (
            <div key={i} className={cn('flex flex-col gap-1.5', m.role === 'user' ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-[85%] px-3.5 py-2.5 rounded-dt text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-accent text-white rounded-br-sm'
                    : 'bg-white text-dt-text border border-dt-border rounded-bl-sm shadow-sm',
                )}
              >
                {m.text}
              </div>

              {/* Suggestions */}
              {m.suggestions && m.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-w-[90%]">
                  {m.suggestions.map((s, si) => (
                    <button
                      key={si}
                      onClick={() => send(s)}
                      className="text-xs bg-white border border-accent text-accent px-2.5 py-1 rounded-full hover:bg-accent hover:text-white transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Escalate to WhatsApp */}
              {m.escalate && m.whatsappUrl && (
                <a
                  href={m.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#25D366] text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-[#1ea855] transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Continuar por WhatsApp
                </a>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start">
              <div className="bg-white border border-dt-border rounded-dt rounded-bl-sm px-3.5 py-2.5 shadow-sm flex gap-1 items-center">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-dt-text-3 inline-block animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
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
          className="flex items-center gap-2 p-3 border-t border-dt-border bg-white shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            disabled={loading}
            className="flex-1 text-sm border border-dt-border rounded-full px-4 py-2 focus:outline-none focus:border-accent text-dt-text placeholder:text-dt-text-3 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-full bg-accent hover:bg-accent/90 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
          </button>
        </form>
      </div>
    </>
  )
}
