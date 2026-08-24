import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ── In-memory cache (resets on container restart) ────────────────────────────
let _tours: TourSummary[] | null = null
let _toursExpiry = 0
let _waNumber: string | null = null

interface TourSummary {
  slug: string
  name: string
  priceAdult: number
  priceChild: number
  duration: string
  minAge: number
  departureZone: string
  categoryName: string
  categoryIcon: string
  imageUrl: string | null
}

async function getCachedTours(): Promise<TourSummary[]> {
  if (_tours && Date.now() < _toursExpiry) return _tours
  const rows = await prisma.tour.findMany({
    where: { active: true },
    select: {
      slug: true, name: true, priceAdult: true, priceChild: true,
      duration: true, minAge: true, departureZone: true,
      category: { select: { name: true, icon: true } },
      images: { select: { url: true }, orderBy: { order: 'asc' }, take: 1 },
    },
    orderBy: [{ featured: 'desc' }, { id: 'asc' }],
    take: 10,
  })
  _tours = rows.map(t => ({
    slug: t.slug,
    name: t.name,
    priceAdult: Number(t.priceAdult),
    priceChild: Number(t.priceChild),
    duration: t.duration,
    minAge: t.minAge,
    departureZone: t.departureZone,
    categoryName: t.category.name,
    categoryIcon: t.category.icon,
    imageUrl: t.images[0]?.url ?? null,
  }))
  _toursExpiry = Date.now() + 5 * 60 * 1000
  return _tours
}

async function getWaNumber(): Promise<string> {
  if (_waNumber) return _waNumber
  const cfg = await prisma.siteConfig.findUnique({ where: { key: 'wa_number' } })
  _waNumber = cfg?.value?.replace(/[^0-9]/g, '') || '18095550100'
  return _waNumber
}

function waUrl(num: string, text = '') {
  return `https://wa.me/${num}${text ? `?text=${encodeURIComponent(text.slice(0, 300))}` : ''}`
}

// ── Intent patterns ──────────────────────────────────────────────────────────
const R: Record<string, RegExp> = {
  greeting:     /^(hola|buenas|buenos\s+d[ií]as|buenas\s+tardes|buenas\s+noches|hey|hello|hi|saludos|ola\b)/i,
  price:        /precio|cu[aá]nt[ao]|cost[ao]|valor|cobr[an]|cu[eé]sta[n]?|tarifas?/i,
  reservation:  /mi\s+reserva|c[oó]digo\s+de\s+reserva|mi\s+c[oó]digo|consultar\s+reserva|estado\s+(de\s+(mi\s+)?)?reserva|donde\s+est[aá]\s+mi|n[uú]mero\s+de\s+reserva/i,
  cancel:       /cancel[ae]r?|devolu[ct]|reembolso|refund|no\s+voy\s+a\s+poder/i,
  transport:    /transporte|pickup|recog[ie]|traslado|punto\s+de\s+(salida|recogida)|c[oó]mo\s+(llego|llegan|me\s+recogen)|nos?\s+buscan/i,
  group:        /grupo\s*(privado)?|privado|corporat|empresa|equipo|10\+|\d{2,}\s+personas?|boda|luna\s+de\s+miel|despedida/i,
  payment:      /pag[ao]|pagar|tarjeta|efectivo|dep[oó]sito|paypal|visa|mastercard|amex|transferencia|cobr[ao]/i,
  children:     /ni[ñn][oa]s?|infant|beb[eé]|peque[ñn][oa]s?|hijos?|familia\s+con|chicos?|menores?/i,
  include:      /qu[eé]\s+incluye|qu[eé]\s+viene|incluye[n]?|included?|comida|almuerzo|bebida|equipo|snorkel|fotos|l[uú]nch/i,
  bring:        /qu[eé]\s+(debo\s+)?(traer|llevar|usar|poner)|vestimenta|ropa|zapatos?|bloqueador|protector\s+solar|qu[eé]\s+necesito/i,
  availability: /disponibilidad|fechas?\s+disponibles?|cu[aá]ndo\s+sale|pr[oó]xim[ao]s?\s+tours?|hay\s+lugar|salidas?/i,
  beach:        /playa|catamar[aá]n|saona|snorkel|arrecife|punta\s+cana|b[aá]varo|boca\s+chica/i,
  adventure:    /aventura|zipline|tirolesa|rappel|escalad|rafting|atv|buggy|cuatrimoto/i,
  waterfall:    /cascada|charco|damajagua|27\s+charcos|saltos?\s+(de\s+agua)?/i,
  whale:        /ballenas?|whale|saman[aá]|humpback|avistamiento/i,
  city:         /ciudad\s+colonial|santo\s+domingo|catedral|zona\s+colonial|historia|colonial/i,
  thanks:       /gracias|thank\s*(you)?|perfect[ao]|excelente|genial|listo\b|ok\s*gracias|muy\s+bien/i,
  human:        /hablar\s+con|agente|humano?|representante|asesor|persona\s+(real|que\s+me\s+ayude)|operador|quiero\s+contactar/i,
  language:     /idioma|ingl[eé]s|english|franc[eé]s|alem[aá]n|ruso|portugu[eé]s/i,
  contact:      /tel[eé]fono|correo|email|direcci[oó]n|donde\s+est[aá]n|oficina/i,
}

const CODE_RE = /\b([A-Z]{1,4}[-]?[0-9]{2,4}[-]?[0-9A-Z]{2,8})\b/

function fmt(n: number) { return `$${Math.floor(n)}` }

function statusLabel(s: string) {
  const map: Record<string, string> = {
    PENDING:   '⏳ Pendiente de confirmación',
    CONFIRMED: '✅ Confirmada',
    COMPLETED: '🏁 Completada',
    CANCELLED: '❌ Cancelada',
  }
  return map[s] ?? s
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = await req.json()
    const msg = (message ?? '').trim()
    if (!msg) return NextResponse.json({ message: '¿En qué puedo ayudarte?' })

    const sid = (sessionId ?? 'anon').toString().slice(0, 100)
    const [tours, waNumber] = await Promise.all([getCachedTours(), getWaNumber()])

    function logEscalation() {
      prisma.chatLog.create({ data: { sessionId: sid, message: msg.slice(0, 500) } }).catch(() => {})
    }

    // ── 1. Reservation code lookup ────────────────────────────────────────
    const codeMatch = msg.match(CODE_RE)
    if (codeMatch || R.reservation.test(msg)) {
      if (codeMatch) {
        const code = codeMatch[1].toUpperCase()
        const resv = await prisma.reservation.findFirst({
          where: { code },
          select: {
            code: true, status: true, firstName: true,
            adults: true, children: true,
            totalAmount: true, depositAmount: true,
            paidDeposit: true, paymentMethod: true,
            tour: { select: { name: true, slug: true } },
            tourDate: { select: { date: true } },
          },
        })
        if (resv) {
          const dateLabel = resv.tourDate?.date
            ? new Date(resv.tourDate.date).toLocaleDateString('es-DO', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })
            : 'Por coordinar'
          return NextResponse.json({
            message: `Encontré tu reserva, ${resv.firstName} 🎫`,
            reservation: {
              code: resv.code,
              status: resv.status,
              statusLabel: statusLabel(resv.status),
              tourName: resv.tour.name,
              tourSlug: resv.tour.slug,
              date: dateLabel,
              adults: resv.adults,
              children: resv.children,
              total: Number(resv.totalAmount),
              deposit: Number(resv.depositAmount),
              paidDeposit: resv.paidDeposit,
            },
            suggestions: resv.status === 'PENDING'
              ? ['¿Cómo confirman mi reserva?', 'Hablar con un agente']
              : resv.status === 'CONFIRMED'
              ? ['¿Qué debo llevar?', 'Información de transporte']
              : ['Ver otras excursiones', 'Hablar con un agente'],
          })
        }
        logEscalation()
        return NextResponse.json({
          message: `No encontré una reserva con el código **${code}**. Verifica que esté escrito correctamente. Si necesitas ayuda, contáctanos directamente.`,
          escalate: true,
          whatsappUrl: waUrl(waNumber, `Hola, quiero consultar el estado de mi reserva: ${code}`),
          suggestions: ['Hablar con un agente'],
        })
      }
      // Asked about reservation but no code provided
      return NextResponse.json({
        message: `¡Claro! Para consultar tu reserva, escribe tu **código de reserva** — lo encontrarás en el correo de confirmación que te enviamos (formato: letras y números).`,
        suggestions: ['Hablar con un agente en WhatsApp'],
      })
    }

    // ── 2. Greeting ───────────────────────────────────────────────────────
    if (R.greeting.test(msg)) {
      return NextResponse.json({
        message: `¡Hola! 🌴 Bienvenido a **Dominicana Tour**. Soy tu asistente virtual y puedo ayudarte con tours, precios y reservas. ¿Qué deseas explorar?`,
        tours: tours.slice(0, 3),
        suggestions: ['Ver precios', 'Consultar mi reserva', 'Tours para niños', 'Transporte'],
      })
    }

    // ── 3. Thanks ─────────────────────────────────────────────────────────
    if (R.thanks.test(msg)) {
      return NextResponse.json({
        message: `¡De nada! 😊 Es un placer ayudarte. ¡Que disfrutes tu aventura en República Dominicana! 🇩🇴`,
        suggestions: ['Ver todas las excursiones', 'Hacer una reserva'],
      })
    }

    // ── 4. Human/agent request ────────────────────────────────────────────
    if (R.human.test(msg)) {
      logEscalation()
      return NextResponse.json({
        message: `Te conecto con nuestro equipo ahora mismo 📱 Responden en minutos.`,
        escalate: true,
        whatsappUrl: waUrl(waNumber, 'Hola, me gustaría hablar con un agente de Dominicana Tour.'),
        suggestions: [],
      })
    }

    // ── 5. Prices ─────────────────────────────────────────────────────────
    if (R.price.test(msg)) {
      const minPrice = tours.length ? Math.min(...tours.map(t => t.priceAdult)) : 45
      return NextResponse.json({
        message: `Nuestros tours comienzan desde **${fmt(minPrice)} USD** por adulto. Precio especial para niños menores de 12 años. El anticipo es solo el **30%** al reservar — el resto se paga el día de la excursión.`,
        tours: tours.slice(0, 4),
        suggestions: ['¿Qué incluye el precio?', 'Tours para niños', 'Cómo reservar'],
      })
    }

    // ── 6. Payment methods ────────────────────────────────────────────────
    if (R.payment.test(msg)) {
      return NextResponse.json({
        message: `Aceptamos:\n\n💳 Tarjeta (Visa, Mastercard, Amex)\n🅿️ PayPal\n💬 Coordinación por WhatsApp\n\nSe solicita un **30% de anticipo** al reservar. El resto se paga el día de la excursión.`,
        suggestions: ['Hacer una reserva', 'Ver excursiones disponibles'],
      })
    }

    // ── 7. Cancellation ───────────────────────────────────────────────────
    if (R.cancel.test(msg)) {
      logEscalation()
      return NextResponse.json({
        message: `Ofrecemos **cancelación gratuita con 48 horas de anticipación**. Para gestionar tu cancelación, contacta a nuestro equipo directamente.`,
        escalate: true,
        whatsappUrl: waUrl(waNumber, 'Hola, necesito cancelar o modificar una reserva.'),
        suggestions: ['Hablar con un agente'],
      })
    }

    // ── 8. Transport ──────────────────────────────────────────────────────
    if (R.transport.test(msg)) {
      return NextResponse.json({
        message: `🚌 La mayoría de nuestros tours **incluyen traslado desde tu hotel o zona de hospedaje**. Al completar la reserva, indicas dónde te hospedarás y coordinamos la recogida.\n\nSi estás en una zona alejada, escríbenos para confirmar cobertura.`,
        suggestions: ['Ver tours con transporte', 'Hacer una reserva', 'Hablar con un agente'],
      })
    }

    // ── 9. Groups / private ───────────────────────────────────────────────
    if (R.group.test(msg)) {
      logEscalation()
      return NextResponse.json({
        message: `🎊 ¡Organizamos grupos privados y eventos especiales! Bodas, despedidas, teambuilding, tours corporativos — con guía exclusivo y atención personalizada.\n\nGrupos de **10+ personas** tienen tarifas especiales. ¿Cuántas personas son?`,
        escalate: true,
        whatsappUrl: waUrl(waNumber, 'Hola, me interesa organizar un tour privado o grupal para ' + msg.slice(0, 100)),
        suggestions: ['Hablar con un agente para grupos'],
      })
    }

    // ── 10. Children ──────────────────────────────────────────────────────
    if (R.children.test(msg)) {
      const kidsOk = tours.filter(t => t.minAge <= 5)
      return NextResponse.json({
        message: `👨‍👩‍👧‍👦 ¡Somos muy family-friendly! Varios tours son perfectos para niños. Los menores de 12 años tienen precio especial, y los bebés (0-3 años) generalmente van gratis.`,
        tours: kidsOk.length >= 2 ? kidsOk.slice(0, 4) : tours.slice(0, 4),
        suggestions: ['¿Qué incluye el precio?', 'Transporte desde el hotel', 'Hacer una reserva'],
      })
    }

    // ── 11. What's included ───────────────────────────────────────────────
    if (R.include.test(msg)) {
      return NextResponse.json({
        message: `En la mayoría de nuestros tours incluimos:\n\n✅ Traslado desde tu hotel\n✅ Guía certificado (Español / Inglés)\n✅ Equipos necesarios (snorkel, chalecos, etc.)\n✅ Seguro de viaje básico\n✅ Entrada a las atracciones\n\n❌ No incluye: Bebidas alcohólicas, propinas, artículos personales.\n\nCada tour tiene su lista específica en la página de la excursión.`,
        suggestions: ['¿Qué debo llevar?', 'Ver excursiones', 'Hacer una reserva'],
      })
    }

    // ── 12. What to bring ─────────────────────────────────────────────────
    if (R.bring.test(msg)) {
      return NextResponse.json({
        message: `🎒 **Te recomendamos llevar:**\n\n• Ropa cómoda y traje de baño\n• Protector solar (biodegradable en áreas naturales)\n• Zapatos cerrados para caminatas\n• Cámara o teléfono en bolsa impermeable\n• Efectivo para propinas y gastos extras\n• Cédula o pasaporte`,
        suggestions: ['¿Qué incluye el tour?', 'Transporte', 'Hacer una reserva'],
      })
    }

    // ── 13. Availability ──────────────────────────────────────────────────
    if (R.availability.test(msg)) {
      return NextResponse.json({
        message: `📅 Tenemos salidas prácticamente **todos los días** del año. Al seleccionar tu excursión en el sitio, verás las fechas disponibles en tiempo real.\n\n¿Tienes fechas específicas en mente?`,
        tours: tours.slice(0, 3),
        suggestions: ['Ver todas las excursiones', 'Hacer una reserva', 'Hablar con un agente'],
      })
    }

    // ── 14. Specific categories ───────────────────────────────────────────
    if (R.whale.test(msg)) {
      const t = tours.filter(t =>
        /ballena|saman[aá]/i.test(t.name + t.departureZone)
      )
      return NextResponse.json({
        message: `🐋 **Avistamiento de Ballenas en Samaná** — una experiencia única en el mundo. Las ballenas jorobadas visitan RD entre **enero y marzo** para aparearse. ¡Inolvidable!`,
        tours: t.length > 0 ? t.slice(0, 3) : tours.slice(0, 3),
        suggestions: ['Ver fechas disponibles', 'Precios', 'Hacer una reserva'],
      })
    }

    if (R.waterfall.test(msg)) {
      const t = tours.filter(t => /charco|cascada|damajagua/i.test(t.name))
      return NextResponse.json({
        message: `🌊 **Los 27 Charcos de Damajagua** son uno de los atractivos naturales más emocionantes de RD — piscinas naturales, cascadas y saltos en plena selva. ¡Una aventura épica!`,
        tours: t.length > 0 ? t.slice(0, 3) : tours.slice(0, 3),
        suggestions: ['¿Qué necesito llevar?', 'Precio', 'Hacer una reserva'],
      })
    }

    if (R.beach.test(msg)) {
      const t = tours.filter(t => /saona|playa|catamar[aá]n|snorkel/i.test(t.name + t.categoryName))
      return NextResponse.json({
        message: `🏖️ Nuestros tours de playa son los más populares — catamará a **Isla Saona**, snorkel en arrecifes de coral y piscina natural. ¡El Caribe en estado puro!`,
        tours: t.length > 0 ? t.slice(0, 4) : tours.slice(0, 4),
        suggestions: ['¿Qué incluye?', 'Tours para niños', 'Hacer una reserva'],
      })
    }

    if (R.adventure.test(msg)) {
      const t = tours.filter(t => /aventura|zipline|atv|buggy|rafting/i.test(t.name + t.categoryName))
      return NextResponse.json({
        message: `🌿 Para los amantes de la adrenalina: ziplines, ATV, rafting, senderismo en montaña. RD tiene una naturaleza increíble más allá de las playas.`,
        tours: t.length > 0 ? t.slice(0, 4) : tours.slice(0, 4),
        suggestions: ['¿Qué nivel físico requiere?', 'Precios', 'Hacer una reserva'],
      })
    }

    if (R.city.test(msg)) {
      const t = tours.filter(t => /colonial|santo\s+domingo|histor/i.test(t.name + t.categoryName))
      return NextResponse.json({
        message: `🏛️ La **Zona Colonial de Santo Domingo** es el primer asentamiento europeo del continente americano — Patrimonio de la Humanidad UNESCO. Catedrales, fortalezas y cultura del siglo XVI.`,
        tours: t.length > 0 ? t.slice(0, 3) : tours.slice(0, 3),
        suggestions: ['Ver excursiones históricas', 'Hacer una reserva'],
      })
    }

    // ── 15. Languages ─────────────────────────────────────────────────────
    if (R.language.test(msg)) {
      return NextResponse.json({
        message: `🌐 Ofrecemos guías en **Español** e **Inglés** en todos los tours. Algunos tours también tienen guías en Francés y Alemán — consulta disponibilidad.`,
        suggestions: ['Ver excursiones', 'Hacer una reserva'],
      })
    }

    // ── 16. Contact info ──────────────────────────────────────────────────
    if (R.contact.test(msg)) {
      return NextResponse.json({
        message: `📞 Puedes contactarnos por WhatsApp — es la forma más rápida. También respondemos consultas por email.\n\nNuestro equipo atiende de **7am a 9pm** todos los días.`,
        escalate: true,
        whatsappUrl: waUrl(waNumber, 'Hola, quisiera obtener más información sobre los tours.'),
        suggestions: ['Hablar por WhatsApp', 'Ver excursiones'],
      })
    }

    // ── Fallback: escalate ────────────────────────────────────────────────
    logEscalation()
    return NextResponse.json({
      message: `Entiendo tu consulta. Para darte la información más precisa, te conecto con nuestro equipo — **responden en minutos** 💬`,
      escalate: true,
      whatsappUrl: waUrl(waNumber, msg),
      suggestions: ['Ver todas las excursiones', 'Ver precios'],
    })

  } catch (e) {
    console.error('[chat]', e)
    return NextResponse.json({ message: 'Ups, algo falló. Escríbenos directamente por WhatsApp.' })
  }
}
