'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

type Reserva = {
  id: number; code: string; status: string
  firstName: string; lastName: string; email: string; phone: string
  country: string; hotel: string; hotelZone: string; language: string
  adults: number; children: number; totalAmount: string; depositAmount: string
  paymentMethod: string; paidDeposit: boolean
  notes: string | null; internalNotes: string | null; createdAt: string
  tour: { name: string; slug: string }
  tourDate: { date: string }
}

const STATUS_STYLE: Record<string, string> = {
  PENDING:   'bg-amber-500/15 text-amber-400',
  CONFIRMED: 'bg-emerald-500/15 text-emerald-400',
  COMPLETED: 'bg-blue-500/15 text-blue-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
}
const STATUS_DOT: Record<string, string> = {
  PENDING: 'bg-amber-400', CONFIRMED: 'bg-emerald-400',
  COMPLETED: 'bg-blue-400', CANCELLED: 'bg-red-400',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada', CANCELLED: 'Cancelada',
}
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DOW = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

const TOUR_COLORS = [
  'bg-accent/20 text-orange-300 border-accent/30',
  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'bg-teal-500/20 text-teal-300 border-teal-500/30',
]

function toDateKey(d: string) { return d.slice(0, 10) }
function fmtCurrency(n: string | number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(Number(n))
}
function fmtDateLong(y: number, m: number, d: number) {
  return new Date(y, m, d).toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })
}

function Row({ label, value, mono, bold, accent }: {
  label: string; value: string; mono?: boolean; bold?: boolean; accent?: boolean
}) {
  return (
    <div className="flex gap-3 py-2 border-b border-dt-border last:border-0">
      <span className="w-28 shrink-0 text-[11px] font-medium text-dt-text-3 uppercase tracking-wide pt-0.5">{label}</span>
      <span className={['text-dt-text text-[13px] leading-snug', mono ? 'font-mono text-accent' : '', bold ? 'font-semibold' : '', accent ? 'text-accent font-bold' : ''].filter(Boolean).join(' ')}>{value || '—'}</span>
    </div>
  )
}

export default function ReservasClient() {
  const searchParams = useSearchParams()
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed
  const [view,  setView]  = useState<'calendar' | 'list'>('calendar')

  const [reservas,  setReservas]  = useState<Reserva[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [updating,  setUpdating]  = useState<number | null>(null)

  // Panel
  const [selectedDay,    setSelectedDay]    = useState<string | null>(null) // YYYY-MM-DD
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null)
  const [panelView,      setPanelView]      = useState<'day' | 'detail'>('day')
  const [editNotes,      setEditNotes]      = useState('')
  const [savingNotes,    setSavingNotes]    = useState(false)

  const didInit = useRef(false)

  const fetchMonth = useCallback(async (y: number, m: number) => {
    setLoading(true)
    const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`
    try {
      const r = await fetch(`/api/admin/reservas?month=${monthStr}`)
      const d = await r.json()
      setReservas(d.reservas ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMonth(year, month) }, [year, month, fetchMonth])

  // Read URL params once on mount to support dashboard deep-links
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    const paramStatus = searchParams.get('status')
    const paramCode   = searchParams.get('code')
    if (paramStatus) {
      setView('list')
      setStatusFilter(paramStatus)
    }
    if (paramCode) {
      setView('list')
      setSearch(paramCode)
    }
  }, [searchParams])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    closePanel()
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    closePanel()
  }
  function closePanel() {
    setSelectedDay(null); setSelectedReserva(null); setPanelView('day')
  }
  function openDay(key: string) {
    setSelectedDay(key); setPanelView('day'); setSelectedReserva(null)
  }
  function openDetail(r: Reserva) {
    setSelectedReserva(r); setEditNotes(r.internalNotes ?? ''); setPanelView('detail')
  }

  async function patch(id: number, body: object) {
    setUpdating(id)
    const res = await fetch(`/api/admin/reservas/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setUpdating(null)
    if (res.ok) {
      setReservas(rs => rs.map(r => r.id === id ? { ...r, ...data.reserva } : r))
      if (selectedReserva?.id === id) {
        setSelectedReserva(s => s ? { ...s, ...data.reserva } : null)
      }
    }
  }

  async function saveNotes() {
    if (!selectedReserva) return
    setSavingNotes(true)
    await patch(selectedReserva.id, { internalNotes: editNotes })
    setSavingNotes(false)
  }

  // Group reservas by date key
  const byDate: Record<string, Reserva[]> = {}
  reservas.forEach(r => {
    const k = toDateKey(r.tourDate.date)
    if (!byDate[k]) byDate[k] = []
    byDate[k].push(r)
  })

  // Build tour color map (stable across renders)
  const tourNames = [...new Set(reservas.map(r => r.tour.name))]
  const tourColorMap: Record<string, string> = {}
  tourNames.forEach((n, i) => { tourColorMap[n] = TOUR_COLORS[i % TOUR_COLORS.length] })

  // Stats
  const pending   = reservas.filter(r => r.status === 'PENDING').length
  const confirmed = reservas.filter(r => r.status === 'CONFIRMED').length
  const total     = reservas.length

  // Calendar grid
  const firstDow  = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMon = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMon }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  // Day reservas for panel
  const dayReservas = selectedDay ? (byDate[selectedDay] ?? []) : []

  // List view filtered
  const listFiltered = reservas.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false
    if (!search.trim()) return true
    return `${r.firstName} ${r.lastName} ${r.code} ${r.tour.name} ${r.email} ${r.phone}`
      .toLowerCase().includes(search.toLowerCase())
  })

  const panelOpen = selectedDay !== null

  return (
    <div className="flex gap-0 relative">
      {/* Main content */}
      <div className={`flex-1 min-w-0 transition-all duration-300 ${panelOpen ? 'mr-[380px]' : ''}`}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {/* Month nav */}
          <div className="flex items-center gap-1">
            <button onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-dt-border text-dt-text-3 hover:bg-dt-bg-2 hover:text-dt-text transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span className="w-40 text-center font-bold text-dt-text text-[15px]">{MONTHS[month]} {year}</span>
            <button onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-dt-border text-dt-text-3 hover:bg-dt-bg-2 hover:text-dt-text transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>

          {/* Stats */}
          {!loading && (
            <div className="flex items-center gap-3 text-[12px]">
              <span className="px-2.5 py-1 rounded-full bg-dt-bg-2 border border-dt-border text-dt-text-2 font-medium">{total} reservas</span>
              {pending > 0 && <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-semibold">{pending} pendiente{pending !== 1 ? 's' : ''}</span>}
              {confirmed > 0 && <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">{confirmed} confirmada{confirmed !== 1 ? 's' : ''}</span>}
            </div>
          )}

          {/* View toggle */}
          <div className="ml-auto flex items-center gap-1 bg-dt-bg-2 border border-dt-border rounded-lg p-0.5">
            <button onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${view === 'calendar' ? 'bg-accent text-white' : 'text-dt-text-3 hover:text-dt-text'}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Calendario
            </button>
            <button onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${view === 'list' ? 'bg-accent text-white' : 'text-dt-text-3 hover:text-dt-text'}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
              Lista
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-64 text-dt-text-3 text-sm">Cargando...</div>
        )}

        {/* CALENDAR VIEW */}
        {!loading && view === 'calendar' && (
          <div className="bg-dt-surface rounded-xl border border-dt-border overflow-hidden">
            {/* DOW headers */}
            <div className="grid grid-cols-7 border-b border-dt-border">
              {DOW.map(d => (
                <div key={d} className="py-2 text-center text-[11px] font-bold text-dt-text-3 uppercase tracking-wider">{d}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                if (day === null) {
                  return <div key={i} className="min-h-[100px] border-b border-r border-dt-border bg-dt-bg/30 last:border-r-0" />
                }
                const key = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                const dayRs = byDate[key] ?? []
                const isToday = key === todayKey
                const isSelected = key === selectedDay

                // Group by tour for pills
                const byTour: Record<string, { count: number; pax: number; statuses: string[] }> = {}
                dayRs.forEach(r => {
                  if (!byTour[r.tour.name]) byTour[r.tour.name] = { count: 0, pax: 0, statuses: [] }
                  byTour[r.tour.name].count++
                  byTour[r.tour.name].pax += r.adults + r.children
                  byTour[r.tour.name].statuses.push(r.status)
                })
                const tourEntries = Object.entries(byTour)

                return (
                  <div
                    key={key}
                    onClick={() => dayRs.length > 0 ? openDay(key) : undefined}
                    className={[
                      'min-h-[100px] border-b border-r border-dt-border p-1.5 transition-colors',
                      (i + 1) % 7 === 0 ? 'border-r-0' : '',
                      dayRs.length > 0 ? 'cursor-pointer hover:bg-dt-bg-2' : '',
                      isSelected ? 'bg-accent/5 border-accent/30' : '',
                      isToday ? 'bg-accent/3' : '',
                    ].join(' ')}
                  >
                    {/* Day number */}
                    <div className={[
                      'w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-semibold mb-1 ml-auto',
                      isToday ? 'bg-accent text-white' : 'text-dt-text-3',
                    ].join(' ')}>
                      {day}
                    </div>

                    {/* Tour pills */}
                    <div className="space-y-0.5">
                      {tourEntries.slice(0, 3).map(([name, info]) => {
                        const hasPending = info.statuses.includes('PENDING')
                        return (
                          <div key={name}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border truncate ${tourColorMap[name]}`}>
                            {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                            <span className="truncate">{name}</span>
                            <span className="ml-auto shrink-0 font-bold opacity-70">{info.pax}p</span>
                          </div>
                        )
                      })}
                      {tourEntries.length > 3 && (
                        <div className="text-[10px] text-dt-text-3 pl-1">+{tourEntries.length - 3} más</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {!loading && view === 'list' && (
          <div>
            <div className="mb-4 relative w-full sm:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dt-text-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input type="text" placeholder="Buscar por nombre, código, tour..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-dt-border rounded-lg bg-dt-bg text-dt-text text-[13px] focus:outline-none focus:border-accent w-full placeholder:text-dt-text-3" />
            </div>

            <div className="bg-dt-surface rounded-xl border border-dt-border overflow-hidden">
              {listFiltered.length === 0 ? (
                <div className="p-12 text-center text-dt-text-3 text-sm">Sin reservas en este mes</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dt-border bg-dt-bg-2 text-dt-text-3 text-left text-[11px] uppercase tracking-wide">
                        <th className="px-4 py-3 font-medium">Código</th>
                        <th className="px-4 py-3 font-medium">Tour · Fecha</th>
                        <th className="px-4 py-3 font-medium hidden sm:table-cell">Cliente</th>
                        <th className="px-4 py-3 font-medium">Pax</th>
                        <th className="px-4 py-3 font-medium">Total</th>
                        <th className="px-4 py-3 font-medium">Anticipo</th>
                        <th className="px-4 py-3 font-medium">Estado</th>
                        <th className="px-4 py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dt-border">
                      {listFiltered.map(r => (
                        <tr key={r.id} className="hover:bg-dt-bg-2 transition-colors">
                          <td className="px-4 py-3">
                            <button onClick={() => { openDay(toDateKey(r.tourDate.date)); setTimeout(() => openDetail(r), 10) }}
                              className="font-mono text-xs font-bold text-accent hover:underline">{r.code}</button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-dt-text text-[13px] leading-snug">{r.tour.name}</div>
                            <div className="text-[11px] text-dt-text-3 mt-0.5">
                              {new Date(r.tourDate.date + 'T12:00:00').toLocaleDateString('es-DO', { day:'2-digit', month:'short' })}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="font-medium text-dt-text text-[13px]">{r.firstName} {r.lastName}</div>
                            <div className="text-[11px] text-dt-text-3">{r.phone}</div>
                          </td>
                          <td className="px-4 py-3 text-center tabular-nums text-[13px]">
                            <span className="font-semibold text-dt-text">{r.adults}</span>
                            {r.children > 0 && <span className="text-dt-text-3">+{r.children}</span>}
                          </td>
                          <td className="px-4 py-3 font-semibold text-[13px] tabular-nums">{fmtCurrency(r.totalAmount)}</td>
                          <td className="px-4 py-3">
                            {r.paidDeposit ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400">Pagado</span>
                            ) : (
                              <button onClick={() => patch(r.id, { paidDeposit: true })} disabled={updating === r.id}
                                className="px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[11px] font-semibold hover:bg-amber-500/20 disabled:opacity-50 transition-colors">
                                {updating === r.id ? '...' : 'Marcar'}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_STYLE[r.status] ?? 'bg-dt-bg-2 text-dt-text-3'}`}>
                              {STATUS_LABEL[r.status] ?? r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openDetail(r)}
                              className="px-2.5 py-1 rounded-md border border-dt-border text-dt-text-2 hover:bg-dt-bg-2 text-[12px] font-medium transition-colors">
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SLIDE-OVER PANEL */}
      {panelOpen && (
        <>
          {/* Backdrop (mobile) */}
          <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={closePanel} />

          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 z-40 w-[380px] flex flex-col bg-dt-bg border-l border-dt-border shadow-2xl overflow-hidden">

            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-dt-border shrink-0 bg-dt-surface">
              {panelView === 'day' ? (
                <div>
                  <p className="font-semibold text-dt-text text-[14px] capitalize">
                    {selectedDay ? fmtDateLong(
                      parseInt(selectedDay.slice(0,4)),
                      parseInt(selectedDay.slice(5,7)) - 1,
                      parseInt(selectedDay.slice(8,10))
                    ) : ''}
                  </p>
                  <p className="text-[11px] text-dt-text-3 mt-0.5">
                    {dayReservas.length} reserva{dayReservas.length !== 1 ? 's' : ''} ·{' '}
                    {dayReservas.reduce((s, r) => s + r.adults + r.children, 0)} personas
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => { setPanelView('day'); setSelectedReserva(null) }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-dt-text-3 hover:text-dt-text hover:bg-dt-bg-2 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <div>
                    <p className="font-mono text-sm font-bold text-accent">{selectedReserva?.code}</p>
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_STYLE[selectedReserva?.status ?? ''] ?? ''}`}>
                      {STATUS_LABEL[selectedReserva?.status ?? ''] ?? ''}
                    </span>
                  </div>
                </div>
              )}
              <button onClick={closePanel}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-dt-text-3 hover:text-dt-text hover:bg-dt-bg-2 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto">

              {/* DAY VIEW */}
              {panelView === 'day' && (
                <div className="divide-y divide-dt-border">
                  {dayReservas.length === 0 && (
                    <div className="p-8 text-center text-dt-text-3 text-sm">Sin reservas este día</div>
                  )}
                  {dayReservas.map(r => (
                    <div key={r.id} className="p-4 hover:bg-dt-surface/50 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_STYLE[r.status] ?? ''}`}>
                            {STATUS_LABEL[r.status] ?? r.status}
                          </span>
                          <span className="font-mono text-xs font-bold text-accent">{r.code}</span>
                        </div>
                        {!r.paidDeposit && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                            Anticipo pend.
                          </span>
                        )}
                      </div>

                      <p className="font-semibold text-dt-text text-[13px]">{r.firstName} {r.lastName}</p>
                      <p className="text-[12px] text-dt-text-3 mt-0.5">{r.tour.name}</p>
                      <p className="text-[12px] text-dt-text-2 mt-0.5">
                        {r.adults} adulto{r.adults !== 1 ? 's' : ''}{r.children > 0 ? ` + ${r.children} niño${r.children !== 1 ? 's' : ''}` : ''} · {fmtCurrency(r.totalAmount)}
                      </p>
                      {(r.hotel || r.hotelZone) && (
                        <p className="text-[11px] text-dt-text-3 mt-0.5">{[r.hotel, r.hotelZone].filter(Boolean).join(' · ')}</p>
                      )}

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {r.phone && (
                          <a href={`https://wa.me/${r.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${r.firstName}, te escribimos de Dominicana Tour sobre tu reserva ${r.code}.`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/20 transition-colors">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            WA
                          </a>
                        )}
                        {r.status === 'PENDING' && (
                          <button onClick={() => patch(r.id, { status: 'CONFIRMED' })} disabled={updating === r.id}
                            className="px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/20 disabled:opacity-50 transition-colors">
                            {updating === r.id ? '...' : 'Confirmar'}
                          </button>
                        )}
                        {r.status === 'CONFIRMED' && (
                          <button onClick={() => patch(r.id, { status: 'COMPLETED' })} disabled={updating === r.id}
                            className="px-2 py-1 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[11px] font-semibold hover:bg-blue-500/20 disabled:opacity-50 transition-colors">
                            Completada
                          </button>
                        )}
                        <button onClick={() => openDetail(r)}
                          className="ml-auto px-2 py-1 rounded border border-dt-border text-dt-text-2 text-[11px] font-medium hover:bg-dt-bg-2 transition-colors">
                          Detalle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* DETAIL VIEW */}
              {panelView === 'detail' && selectedReserva && (
                <div className="p-4">
                  <div className="space-y-0 mb-4">
                    <Row label="Tour"     value={selectedReserva.tour.name} bold />
                    <Row label="Fecha"    value={new Date(selectedReserva.tourDate.date + 'T12:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })} />
                    <Row label="Cliente"  value={`${selectedReserva.firstName} ${selectedReserva.lastName}`} />
                    <Row label="WhatsApp" value={selectedReserva.phone} />
                    {selectedReserva.email    && <Row label="Email"  value={selectedReserva.email} />}
                    {selectedReserva.country  && <Row label="País"   value={selectedReserva.country} />}
                    {(selectedReserva.hotel || selectedReserva.hotelZone) && (
                      <Row label="Hotel" value={[selectedReserva.hotel, selectedReserva.hotelZone].filter(Boolean).join(' · ')} />
                    )}
                    {selectedReserva.language && <Row label="Idioma" value={selectedReserva.language} />}
                    <Row label="Grupo"    value={`${selectedReserva.adults} adulto${selectedReserva.adults !== 1 ? 's' : ''}${selectedReserva.children > 0 ? ` + ${selectedReserva.children} niño${selectedReserva.children !== 1 ? 's' : ''}` : ''}`} />
                    <Row label="Total"    value={fmtCurrency(selectedReserva.totalAmount)} bold />
                    <Row label="Anticipo" value={`${fmtCurrency(selectedReserva.depositAmount)} · ${selectedReserva.paidDeposit ? 'Pagado' : 'Pendiente'}`} />
                    <Row label="Método"   value={selectedReserva.paymentMethod} />
                    {selectedReserva.notes && <Row label="Nota" value={selectedReserva.notes} />}
                  </div>

                  {/* Internal notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-dt-text-3 uppercase tracking-wide mb-1.5">
                      Notas internas
                    </label>
                    <textarea rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)}
                      placeholder="Solo visibles para el equipo..."
                      className="w-full px-3 py-2 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-[13px] focus:outline-none focus:border-accent resize-none placeholder:text-dt-text-3" />
                    <button onClick={saveNotes} disabled={savingNotes}
                      className="mt-1.5 px-3 py-1.5 border border-dt-border text-dt-text-2 rounded-lg text-xs font-medium hover:bg-dt-bg-2 disabled:opacity-50 transition-colors">
                      {savingNotes ? 'Guardando...' : 'Guardar notas'}
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dt-border">
                    {selectedReserva.phone && (
                      <a href={`https://wa.me/${selectedReserva.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola ${selectedReserva.firstName}, te escribimos de Dominicana Tour sobre tu reserva ${selectedReserva.code}.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[12px] font-semibold hover:bg-emerald-500/20 transition-colors">
                        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Contactar WA
                      </a>
                    )}
                    {!selectedReserva.paidDeposit && (
                      <button onClick={() => patch(selectedReserva.id, { paidDeposit: true })} disabled={updating === selectedReserva.id}
                        className="px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[12px] font-semibold hover:bg-amber-500/20 disabled:opacity-50 transition-colors">
                        Confirmar anticipo
                      </button>
                    )}
                    {selectedReserva.status === 'PENDING' && (
                      <button onClick={() => patch(selectedReserva.id, { status: 'CONFIRMED' })} disabled={updating === selectedReserva.id}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-[12px] font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                        {updating === selectedReserva.id ? '...' : 'Confirmar'}
                      </button>
                    )}
                    {selectedReserva.status === 'CONFIRMED' && (
                      <button onClick={() => patch(selectedReserva.id, { status: 'COMPLETED' })} disabled={updating === selectedReserva.id}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-[12px] font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        Completada
                      </button>
                    )}
                    {selectedReserva.status !== 'CANCELLED' && selectedReserva.status !== 'COMPLETED' && (
                      <button onClick={() => patch(selectedReserva.id, { status: 'CANCELLED' })} disabled={updating === selectedReserva.id}
                        className="px-3 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-[12px] font-semibold hover:bg-red-600/30 disabled:opacity-50 transition-colors">
                        Cancelar
                      </button>
                    )}
                    <button
                      onClick={() => window.open(`/admin/ticket/${selectedReserva.code}`, '_blank')}
                      className="flex items-center gap-1.5 px-3 py-2 border border-dt-border text-dt-text-2 rounded-lg text-[12px] font-semibold hover:bg-dt-bg-2 transition-colors ml-auto">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                      Imprimir ticket
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
