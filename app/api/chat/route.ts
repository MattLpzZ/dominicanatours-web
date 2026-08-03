import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const RULES: [RegExp, string][] = [
  [/precio|cuanto|costo|valor/i, 'Nuestros tours comienzan desde 45 USD por persona. El precio varia segun la excursion. Te cuento sobre alguna en especifico?'],
  [/reserva|reservar|libro|apartar/i, 'Para reservar: elige tu excursion, selecciona la fecha y completa el formulario. Tambien puedes escribirnos por WhatsApp y te ayudamos de inmediato.'],
  [/cancel|devolu|refund/i, 'Ofrecemos cancelacion gratuita con 48 horas de anticipacion. Ante cualquier imprevisto, contactanos y buscamos una solucion.'],
  [/transporte|pickup|hotel|recog/i, 'Incluimos transporte puerta a puerta desde tu hotel en la mayoria de excursiones. El punto de salida lo confirmas al reservar.'],
  [/grupo|privado|corporat/i, 'Organizamos grupos privados y corporativos con guia exclusivo. Para grupos de 10+ tenemos tarifas especiales.'],
  [/idioma|ingles|english|frances/i, 'Ofrecemos tours en Espanol e Ingles. Algunos tambien en Frances.'],
  [/pago|pagar|tarjeta|efectivo|deposito/i, 'Aceptamos Visa/Mastercard, PayPal y efectivo. Se solicita un deposito para confirmar. El resto se paga el dia del tour.'],
  [/punta cana/i, 'Desde Punta Cana tenemos excursiones increibles: Isla Saona, Snorkel, Laguna Gri-Gri y mas.'],
  [/samana|ballena/i, 'Samana es magico: el avistamiento de ballenas jorobadas (enero-marzo) es una experiencia unica.'],
  [/charco|damajagua|cascada/i, 'Los 27 Charcos de Damajagua son una aventura increible — cascadas y saltos naturales.'],
  [/hola|buenas|hey|hello|hi/i, 'Hola! Soy el asistente de Dominicana Tour. Te ayudo con excursiones, precios y reservas. Que deseas saber?'],
  [/gracias|thanks/i, 'De nada! Estamos para servirte. Que disfrutes tu viaje!'],
]

const SUGGESTIONS_FALLBACK = ['Ver excursiones de playa', 'Precios y disponibilidad', 'Hacer una reserva']
const FALLBACK = 'Para darte la informacion mas precisa, te conectamos con nuestro equipo por WhatsApp — responden al instante.'
const WA_BASE = 'https://wa.me/18095550100'

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = await req.json()
    if (!message?.trim()) return NextResponse.json({ message: FALLBACK })

    for (const [pattern, reply] of RULES) {
      if (pattern.test(message)) {
        return NextResponse.json({ message: reply })
      }
    }

    // Log escalation (fire-and-forget)
    prisma.chatLog.create({
      data: {
        sessionId: (sessionId ?? 'anon').toString().slice(0, 100),
        message: message.trim().slice(0, 500),
      },
    }).catch(() => {})

    return NextResponse.json({
      message: FALLBACK,
      escalate: true,
      whatsappUrl: `${WA_BASE}?text=${encodeURIComponent(message.trim().slice(0, 200))}`,
      suggestions: SUGGESTIONS_FALLBACK,
    })
  } catch {
    return NextResponse.json({ message: FALLBACK })
  }
}
