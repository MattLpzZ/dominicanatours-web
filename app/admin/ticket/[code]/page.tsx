import { notFound, redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { TicketActions } from './TicketActions'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | string) {
  return new Date(typeof d === 'string' ? d + 'T12:00:00' : d)
    .toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtCurrency(n: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}

export default async function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  const { code } = await params

  const r = await prisma.reservation.findUnique({
    where: { code },
    include: {
      tour: { select: { name: true, slug: true, duration: true, departureZone: true } },
      tourDate: { select: { date: true } },
    },
  })

  if (!r) notFound()

  const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Pendiente', CONFIRMED: 'Confirmada', COMPLETED: 'Completada', CANCELLED: 'Cancelada',
  }
  const STATUS_COLOR: Record<string, string> = {
    PENDING: '#D97706', CONFIRMED: '#059669', COMPLETED: '#2563EB', CANCELLED: '#DC2626',
  }
  const statusColor = STATUS_COLOR[r.status] ?? '#6B7280'
  const statusLabel = STATUS_LABEL[r.status] ?? r.status

  const issueDate = new Date().toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Inter, system-ui, -apple-system, sans-serif; background: #f3f4f6; color: #111827; }
        .ticket { max-width: 680px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
        .header { background: #E85D20; color: #fff; padding: 28px 32px 24px; }
        .header-top { display: flex; align-items: flex-start; justify-content: space-between; }
        .company { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .company-sub { font-size: 11px; opacity: 0.85; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }
        .ticket-label { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; opacity: 0.85; }
        .ticket-code { font-size: 28px; font-weight: 900; letter-spacing: 2px; font-variant-numeric: tabular-nums; margin-top: 4px; }
        .status-badge { display: inline-block; margin-top: 16px; padding: 4px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.2); }
        .body { padding: 28px 32px; }
        .section-title { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #6B7280; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #E5E7EB; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .field label { font-size: 11px; color: #6B7280; font-weight: 600; margin-bottom: 3px; display: block; }
        .field span { font-size: 14px; color: #111827; font-weight: 500; }
        .field span.bold { font-weight: 700; }
        .divider { border: none; border-top: 2px dashed #E5E7EB; margin: 20px -32px; }
        .price-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .price-table td { padding: 8px 0; font-size: 14px; vertical-align: top; }
        .price-table td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
        .price-table .total-row td { font-size: 16px; font-weight: 800; padding-top: 12px; border-top: 2px solid #111827; }
        .deposit-box { background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; }
        .deposit-box .label { font-size: 12px; color: #92400E; font-weight: 600; }
        .deposit-box .amount { font-size: 18px; font-weight: 800; color: #92400E; }
        .deposit-paid { background: #ECFDF5; border-color: #A7F3D0; }
        .deposit-paid .label, .deposit-paid .amount { color: #065F46; }
        .footer { background: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 18px 32px; display: flex; align-items: center; justify-content: space-between; }
        .footer-left { font-size: 12px; color: #6B7280; line-height: 1.6; }
        .footer-right { font-size: 11px; color: #9CA3AF; text-align: right; }
        .print-btn { display: flex; gap: 10px; justify-content: center; margin: 24px auto 0; max-width: 680px; }
        .btn { padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; }
        .btn-primary { background: #E85D20; color: #fff; }
        .btn-secondary { background: #fff; color: #374151; border: 1px solid #D1D5DB; }
        .notes-box { background: #F3F4F6; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #374151; margin-top: 16px; }
        .notes-box strong { font-size: 11px; color: #6B7280; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px; }
        @media print {
          body { background: #fff; }
          .print-btn { display: none !important; }
          .ticket { box-shadow: none; margin: 0; border-radius: 0; }
        }
      `}</style>

      <TicketActions />

      <div className="ticket">
        <div className="header">
          <div className="header-top">
            <div>
              <div className="company">Dominicana Tour</div>
              <div className="company-sub">Operadora Turística Oficial · RD</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div className="ticket-label">Nro. de Reserva</div>
              <div className="ticket-code">{r.code}</div>
            </div>
          </div>
          <div className="status-badge" style={{background: `${statusColor}33`, border: `1px solid ${statusColor}66`, color: '#fff'}}>
            {statusLabel}
          </div>
        </div>

        <div className="body">
          <p className="section-title">Detalle de la excursión</p>
          <div className="grid2" style={{marginBottom: 8}}>
            <div className="field">
              <label>Tour</label>
              <span className="bold">{r.tour.name}</span>
            </div>
            <div className="field">
              <label>Fecha</label>
              <span className="bold">{r.tourDate?.date ? fmtDate(r.tourDate.date) : 'A coordinar'}</span>
            </div>
            {r.tour.departureZone && (
              <div className="field">
                <label>Zona de salida</label>
                <span>{r.tour.departureZone}</span>
              </div>
            )}
            {r.tour.duration && (
              <div className="field">
                <label>Duración</label>
                <span>{r.tour.duration}</span>
              </div>
            )}
          </div>

          <hr className="divider" />

          <p className="section-title" style={{marginTop: 20}}>Datos del cliente</p>
          <div className="grid2">
            <div className="field">
              <label>Nombre completo</label>
              <span className="bold">{r.firstName} {r.lastName}</span>
            </div>
            <div className="field">
              <label>WhatsApp</label>
              <span>{r.phone}</span>
            </div>
            {r.email && (
              <div className="field">
                <label>Email</label>
                <span>{r.email}</span>
              </div>
            )}
            {(r.hotel || r.hotelZone) && (
              <div className="field">
                <label>Hotel / Zona</label>
                <span>{[r.hotel, r.hotelZone].filter(Boolean).join(' · ')}</span>
              </div>
            )}
            {r.country && (
              <div className="field">
                <label>País de origen</label>
                <span>{r.country}</span>
              </div>
            )}
            {r.language && (
              <div className="field">
                <label>Idioma</label>
                <span>{r.language}</span>
              </div>
            )}
          </div>

          <hr className="divider" />

          <p className="section-title" style={{marginTop: 20}}>Resumen de pago</p>
          <table className="price-table">
            <tbody>
              <tr>
                <td style={{color: '#6B7280'}}>
                  {r.adults} Adulto{r.adults !== 1 ? 's' : ''}
                </td>
                <td>{fmtCurrency(Number(r.totalAmount))}</td>
              </tr>
              {r.children > 0 && (
                <tr>
                  <td style={{color: '#6B7280'}}>{r.children} Niño{r.children !== 1 ? 's' : ''}</td>
                  <td>incluido</td>
                </tr>
              )}
              <tr className="total-row">
                <td>Total</td>
                <td>{fmtCurrency(Number(r.totalAmount))}</td>
              </tr>
            </tbody>
          </table>

          <div className={`deposit-box${r.paidDeposit ? ' deposit-paid' : ''}`}>
            <div>
              <div className="label">Anticipo {r.paidDeposit ? '(Pagado ✓)' : '(Pendiente)'}</div>
              <div style={{fontSize:11, marginTop:2, color: r.paidDeposit ? '#065F46' : '#92400E', opacity: 0.8}}>
                Método: {r.paymentMethod ?? 'No especificado'}
              </div>
            </div>
            <div className="amount">{fmtCurrency(Number(r.depositAmount))}</div>
          </div>

          {(r.notes || r.internalNotes) && (
            <div className="notes-box">
              {r.notes && <><strong>Nota del cliente</strong>{r.notes}</>}
              {r.internalNotes && <><strong style={{marginTop: r.notes ? 8 : 0}}>Nota interna</strong>{r.internalNotes}</>}
            </div>
          )}
        </div>

        <div className="footer">
          <div className="footer-left">
            <strong>Dominicana Tour</strong><br />
            dominicanatour.com · info@dominicanatour.com
          </div>
          <div className="footer-right">
            Emitido: {issueDate}<br />
            Este ticket es tu comprobante de reserva
          </div>
        </div>
      </div>
    </>
  )
}
