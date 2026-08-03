export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}
function fmtDate(d: Date) {
  return d.toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })
}

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOf6Mo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [allCount, monthAgg, statusCounts, topTours, monthlySeries] = await Promise.all([
    prisma.reservation.count(),
    prisma.reservation.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
    }),
    prisma.reservation.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.tour.findMany({
      where: { active: true },
      include: {
        category: { select: { name: true } },
        provider: { select: { name: true } },
        _count: { select: { reservations: true } },
        reservations: { where: { status: { not: 'CANCELLED' } }, select: { totalAmount: true } },
      },
      orderBy: { reservations: { _count: 'desc' } },
      take: 10,
    }),
    prisma.$queryRaw<{ month: string; revenue: number; count: number }[]>`
      SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month,
        COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN CAST(totalAmount AS DECIMAL(10,2)) ELSE 0 END), 0) AS revenue,
        COUNT(*) AS count
      FROM Reservation WHERE createdAt >= ${startOf6Mo}
      GROUP BY month ORDER BY month ASC`,
  ])

  const monthRevenue = Number(monthAgg._sum.totalAmount ?? 0)
  const totalRevenue = topTours.reduce((s, t) => s + t.reservations.reduce((rs, r) => rs + Number(r.totalAmount), 0), 0)

  const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Pendiente', CONFIRMED: 'Confirmada', COMPLETED: 'Completada', CANCELLED: 'Cancelada',
  }
  const MONTH_NAMES: Record<string, string> = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
  }
  const maxRev = Math.max(...(Array.isArray(monthlySeries) ? monthlySeries.map((m: any) => Number(m.revenue)) : [0]), 1)

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Reporte ? Dominicana Tour</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1a1a2e; background: #fff; padding: 0; }
  .page { max-width: 900px; margin: 0 auto; padding: 32px 36px; }

  /* Header */
  .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #e85d1f; padding-bottom: 16px; margin-bottom: 28px; }
  .brand { display: flex; flex-direction: column; gap: 2px; }
  .brand-name { font-size: 20pt; font-weight: 800; color: #e85d1f; letter-spacing: -0.5px; }
  .brand-sub  { font-size: 8pt; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .report-meta { text-align: right; }
  .report-title { font-size: 13pt; font-weight: 700; color: #1a1a2e; }
  .report-date  { font-size: 9pt; color: #888; margin-top: 2px; }

  /* KPI cards */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .kpi { border: 1.5px solid #e8e8e8; border-radius: 10px; padding: 14px 16px; }
  .kpi-label { font-size: 8pt; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .kpi-value { font-size: 18pt; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px; }
  .kpi-sub   { font-size: 8pt; color: #aaa; margin-top: 2px; }

  /* Section headers */
  h2 { font-size: 11pt; font-weight: 700; color: #1a1a2e; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1.5px solid #f0f0f0; }
  .section { margin-bottom: 24px; }

  /* Bar chart */
  .bars { display: flex; align-items: flex-end; gap: 8px; height: 90px; margin-bottom: 4px; }
  .bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 3px; }
  .bar-label { font-size: 7.5pt; color: #888; }
  .bar-val   { font-size: 7pt; color: #555; }
  .bar-wrap  { width: 100%; display: flex; flex-direction: column; justify-content: flex-end; height: 60px; }
  .bar       { width: 100%; background: #e85d1f; border-radius: 3px 3px 0 0; }
  .bar-past  { background: #f5c1a6; }

  /* Status pills */
  .status-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .pill { font-size: 8pt; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
  .pill-pending   { background: #fff8e6; color: #b45309; }
  .pill-confirmed { background: #ecfdf5; color: #059669; }
  .pill-completed { background: #eff6ff; color: #2563eb; }
  .pill-cancelled { background: #fff1f1; color: #dc2626; }
  .progress-bar-bg { flex: 1; height: 5px; background: #f0f0f0; border-radius: 3px; margin: 0 10px; overflow: hidden; }
  .progress-bar-fill { height: 100%; border-radius: 3px; }

  /* Table */
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  th { background: #f8f8f8; color: #555; font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; padding: 8px 10px; text-align: left; border-bottom: 1.5px solid #e8e8e8; }
  td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; color: #1a1a2e; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  .num { font-variant-numeric: tabular-nums; }
  .rank { font-size: 8pt; color: #aaa; font-weight: 700; }
  .provider-badge { font-size: 7.5pt; font-weight: 600; color: #e85d1f; background: #fef3ee; padding: 1px 6px; border-radius: 99px; }
  .margin-positive { color: #059669; font-weight: 700; }
  .margin-negative { color: #dc2626; font-weight: 700; }
  .margin-none     { color: #aaa; }

  /* Footer */
  .report-footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #f0f0f0; display: flex; justify-content: space-between; font-size: 8pt; color: #bbb; }

  @media print {
    body { background: #fff; }
    .page { padding: 20px 24px; }
    .no-print { display: none !important; }
    @page { size: A4; margin: 1.5cm 1cm; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Print button (hidden on print) -->
  <div class="no-print" style="margin-bottom:20px;display:flex;gap:10px;align-items:center">
    <button onclick="window.print()" style="background:#e85d1f;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">
      Imprimir / Guardar PDF
    </button>
    <button onclick="window.close()" style="background:#f0f0f0;color:#333;border:none;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">
      Cerrar
    </button>
  </div>

  <!-- Header -->
  <div class="report-header">
    <div class="brand">
      <span class="brand-name">Dominicana Tour</span>
      <span class="brand-sub">Panel de administraci?n</span>
    </div>
    <div class="report-meta">
      <div class="report-title">Reporte General</div>
      <div class="report-date">Generado: ${fmtDate(now)}</div>
    </div>
  </div>

  <!-- KPIs -->
  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">Ingresos del mes</div>
      <div class="kpi-value">${fmtCurrency(monthRevenue)}</div>
      <div class="kpi-sub">${now.toLocaleString('es-DO', { month: 'long', year: 'numeric' })}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Total reservas</div>
      <div class="kpi-value">${allCount}</div>
      <div class="kpi-sub">acumulado hist?rico</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Ingresos totales</div>
      <div class="kpi-value">${fmtCurrency(totalRevenue)}</div>
      <div class="kpi-sub">tours activos</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Pendientes</div>
      <div class="kpi-value">${statusCounts.find((s: any) => s.status === 'PENDING')?._count?._all ?? 0}</div>
      <div class="kpi-sub">requieren acci?n</div>
    </div>
  </div>

  <!-- Monthly chart + Status -->
  <div style="display:grid;grid-template-columns:1fr 240px;gap:20px;margin-bottom:24px">
    <div class="section" style="margin-bottom:0">
      <h2>Ingresos mensuales (?ltimos 6 meses)</h2>
      <div class="bars">
        ${Array.isArray(monthlySeries) ? monthlySeries.map((m: any) => {
          const rev = Number(m.revenue)
          const pct = Math.max((rev / maxRev) * 100, 2)
          const [, mo] = String(m.month).split('-')
          const isCurrent = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` === m.month
          return `<div class="bar-col">
            <div class="bar-val">${rev > 0 ? fmtCurrency(rev) : '?'}</div>
            <div class="bar-wrap"><div class="bar ${isCurrent ? '' : 'bar-past'}" style="height:${pct}%"></div></div>
            <div class="bar-label" style="${isCurrent ? 'color:#e85d1f;font-weight:700' : ''}">${MONTH_NAMES[mo] ?? mo}</div>
          </div>`
        }).join('') : '<p style="color:#aaa;font-size:9pt">Sin datos</p>'}
      </div>
    </div>
    <div class="section" style="margin-bottom:0">
      <h2>Por estado</h2>
      ${statusCounts.map((s: any) => {
        const total = statusCounts.reduce((a: number, x: any) => a + Number(x._count._all), 0)
        const pct = total > 0 ? (Number(s._count._all) / total) * 100 : 0
        const colorMap: Record<string, string> = { PENDING: '#f59e0b', CONFIRMED: '#10b981', COMPLETED: '#3b82f6', CANCELLED: '#ef4444' }
        const pillMap: Record<string, string> = { PENDING: 'pill-pending', CONFIRMED: 'pill-confirmed', COMPLETED: 'pill-completed', CANCELLED: 'pill-cancelled' }
        return `<div class="status-row">
          <span class="pill ${pillMap[s.status] ?? ''}">${STATUS_LABEL[s.status] ?? s.status}</span>
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%;background:${colorMap[s.status] ?? '#999'}"></div></div>
          <span style="font-size:8.5pt;font-weight:700;color:#555">${Number(s._count._all)}</span>
        </div>`
      }).join('')}
    </div>
  </div>

  <!-- Top tours -->
  <div class="section">
    <h2>Tours por rendimiento</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Tour</th>
          <th>Proveedor</th>
          <th>Reservas</th>
          <th>Ingresos</th>
          <th>Costo prov.</th>
          <th>Margen</th>
        </tr>
      </thead>
      <tbody>
        ${topTours.map((t, i) => {
          const rev = t.reservations.reduce((s, r) => s + Number(r.totalAmount), 0)
          const cost = (t as any).costPrice ? Number((t as any).costPrice) * t._count.reservations : null
          const margin = cost !== null ? rev - cost : null
          const marginPct = margin !== null && rev > 0 ? (margin / rev) * 100 : null
          return `<tr>
            <td class="rank">#${i + 1}</td>
            <td>
              <div style="font-weight:600">${t.name}</div>
              <div style="font-size:8pt;color:#888">${t.category.name}</div>
            </td>
            <td>${t.provider ? `<span class="provider-badge">${t.provider.name}</span>` : '<span style="color:#ccc">?</span>'}</td>
            <td class="num" style="font-weight:700;color:#e85d1f">${t._count.reservations}</td>
            <td class="num">${fmtCurrency(rev)}</td>
            <td class="num">${cost !== null ? fmtCurrency(cost) : '<span style="color:#ccc">?</span>'}</td>
            <td class="num ${margin === null ? 'margin-none' : margin >= 0 ? 'margin-positive' : 'margin-negative'}">
              ${margin !== null ? `${fmtCurrency(margin)}${marginPct !== null ? ` (${marginPct.toFixed(0)}%)` : ''}` : '?'}
            </td>
          </tr>`
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="report-footer">
    <span>Dominicana Tour ? Panel Admin</span>
    <span>Reporte generado el ${fmtDate(now)}</span>
    <span>soymattlpzz.com</span>
  </div>

</div>
<script>
  // Auto-print when opened directly (not from within iframe)
  if (window.opener || document.referrer.includes('/admin')) {
    // opened from admin panel ? user clicks the button manually
  }
</script>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

