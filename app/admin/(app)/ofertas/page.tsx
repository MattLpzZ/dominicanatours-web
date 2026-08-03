'use client'
import { useEffect, useState, useRef } from 'react'

interface Offer {
  id: number; tourId: number; label: string; discountPercent: number
  startsAt: string; endsAt: string; active: boolean
  tour?: { name: string }
}

interface Tour { id: number; name: string }

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function TourSearch({ tours, value, onChange }: {
  tours: Tour[]; value: string; onChange: (id: string) => void
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = tours.find(t => String(t.id) === value)

  const filtered = q.trim()
    ? tours.filter(t => t.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : tours.slice(0, 8)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function pick(t: Tour) {
    onChange(String(t.id))
    setQ('')
    setOpen(false)
  }

  function clear() {
    onChange('')
    setQ('')
  }

  return (
    <div ref={ref} className="relative">
      <div className={[
        'flex items-center gap-2 w-full border rounded-lg px-3 py-2 bg-dt-bg transition-colors',
        open ? 'border-accent' : 'border-dt-border',
      ].join(' ')}>
        <svg className="w-3.5 h-3.5 text-dt-text-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {selected && !open ? (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="text-dt-text text-sm truncate">{selected.name}</span>
            <button type="button" onClick={clear} className="text-dt-text-3 hover:text-dt-text ml-2 shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <input
            type="text"
            placeholder={tours.length === 0 ? 'Cargando tours...' : 'Buscar tour por nombre...'}
            value={q}
            onFocus={() => setOpen(true)}
            onChange={e => { setQ(e.target.value); setOpen(true) }}
            className="flex-1 bg-transparent text-dt-text text-sm focus:outline-none placeholder:text-dt-text-3"
          />
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-dt-surface border border-dt-border rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
          {filtered.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => pick(t)}
              className="w-full text-left px-4 py-2.5 text-sm text-dt-text hover:bg-accent/5 hover:text-accent transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5 text-dt-text-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {t.name}
            </button>
          ))}
          {q && filtered.length === 0 && (
            <p className="px-4 py-3 text-dt-text-3 text-sm">Sin resultados para "{q}"</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function OfertasPage() {
  const [offers, setOffers]     = useState<Offer[]>([])
  const [tours, setTours]       = useState<Tour[]>([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState({ tourId: '', label: '', discountPercent: '10', startsAt: '', endsAt: '' })
  const [saving, setSaving]     = useState(false)
  const [notifying, setNotifying] = useState<number | null>(null)
  const [notifyResult, setNotifyResult] = useState<{ id: number; msg: string } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/ofertas').then(r => r.json()),
      fetch('/api/admin/tours').then(r => r.json()),
    ]).then(([o, t]) => {
      setOffers(o.offers ?? o.data ?? [])
      setTours(t.tours ?? t.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!form.tourId) return
    setSaving(true)
    const res = await fetch('/api/admin/ofertas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tourId: Number(form.tourId), discountPercent: Number(form.discountPercent) }),
    })
    const data = await res.json()
    const newOffer: Offer = data.offer ?? data
    const tour = tours.find(t => t.id === Number(form.tourId))
    setOffers(prev => [{ ...newOffer, tour: tour ? { name: tour.name } : undefined }, ...prev])
    setForm({ tourId: '', label: '', discountPercent: '10', startsAt: '', endsAt: '' })
    setSaving(false)
  }

  async function toggle(id: number, active: boolean) {
    await fetch(`/api/admin/ofertas/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !active }) })
    setOffers(prev => prev.map(o => o.id === id ? { ...o, active: !active } : o))
  }

  async function del(id: number) {
    if (!confirm('?Eliminar oferta?')) return
    await fetch(`/api/admin/ofertas/${id}`, { method: 'DELETE' })
    setOffers(prev => prev.filter(o => o.id !== id))
  }

  async function notify(id: number) {
    setNotifying(id)
    try {
      const res = await fetch(`/api/admin/ofertas/${id}/notify`, { method: 'POST' })
      const data = await res.json()
      setNotifyResult({ id, msg: `Enviado a ${data.sent} suscriptor${data.sent !== 1 ? 'es' : ''}${data.failed > 0 ? ` (${data.failed} fallidos)` : ''}` })
      setTimeout(() => setNotifyResult(null), 4000)
    } finally {
      setNotifying(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-dt-text">Ofertas</h1>
          <p className="text-[13px] text-dt-text-3 mt-0.5">Descuentos por tour con fecha de vigencia</p>
        </div>
        {loading && <span className="text-[12px] text-dt-text-3">Cargando tours...</span>}
      </div>

      {/* Create form */}
      <form onSubmit={create} className="bg-dt-surface border border-dt-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-dt-text text-[13px]">Nueva oferta</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-dt-text-2 mb-1.5">Tour *</label>
            <TourSearch tours={tours} value={form.tourId} onChange={id => setForm(p => ({ ...p, tourId: id }))} />
            {tours.length === 0 && !loading && (
              <p className="text-[11px] text-amber-400 mt-1">No hay tours registrados a?n.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-dt-text-2 mb-1.5">Etiqueta *</label>
            <input type="text" placeholder="Ej: Especial Verano" value={form.label}
              onChange={e => setForm(p => ({ ...p, label: e.target.value }))} required
              className="w-full border border-dt-border rounded-lg px-3 py-2 text-dt-text bg-dt-bg text-sm focus:outline-none focus:border-accent placeholder:text-dt-text-3" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dt-text-2 mb-1.5">Descuento %</label>
            <input type="number" min="1" max="80" value={form.discountPercent}
              onChange={e => setForm(p => ({ ...p, discountPercent: e.target.value }))} required
              className="w-full border border-dt-border rounded-lg px-3 py-2 text-dt-text bg-dt-bg text-sm focus:outline-none focus:border-accent" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dt-text-2 mb-1.5">Desde</label>
            <input type="date" value={form.startsAt}
              onChange={e => setForm(p => ({ ...p, startsAt: e.target.value }))} required
              className="w-full border border-dt-border rounded-lg px-3 py-2 text-dt-text bg-dt-bg text-sm focus:outline-none focus:border-accent" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dt-text-2 mb-1.5">Hasta</label>
            <input type="date" value={form.endsAt}
              onChange={e => setForm(p => ({ ...p, endsAt: e.target.value }))} required
              className="w-full border border-dt-border rounded-lg px-3 py-2 text-dt-text bg-dt-bg text-sm focus:outline-none focus:border-accent" />
          </div>
        </div>

        <button type="submit" disabled={saving || !form.tourId}
          className="w-full sm:w-auto bg-accent text-white font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors">
          {saving ? 'Guardando...' : 'Crear oferta'}
        </button>
      </form>

      {/* List */}
      {loading ? (
        <div className="bg-dt-surface border border-dt-border rounded-xl p-8 text-center text-dt-text-3 text-sm">
          Cargando...
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-dt-surface border border-dt-border rounded-xl p-8 text-center">
          <p className="text-dt-text-3 text-sm">No hay ofertas a?n.</p>
        </div>
      ) : (
        <div className="bg-dt-surface border border-dt-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-dt-border flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-dt-text">Ofertas activas ? {offers.filter(o => o.active).length}/{offers.length}</h2>
          </div>
          <div className="divide-y divide-dt-border">
            {offers.map(o => (
              <div key={o.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-dt-bg-2 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={[
                      'text-[11px] font-bold px-2 py-0.5 rounded-full',
                      o.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-dt-bg-2 text-dt-text-3',
                    ].join(' ')}>
                      {o.active ? 'Activa' : 'Inactiva'}
                    </span>
                    <span className="text-accent font-bold text-[13px]">{o.discountPercent}% OFF</span>
                    <span className="text-dt-text font-medium text-[13px]">{o.label}</span>
                  </div>
                  <p className="text-dt-text-3 text-xs">
                    {o.tour?.name ?? `Tour #${o.tourId}`} ? {fmtDate(o.startsAt)} ? {fmtDate(o.endsAt)}
                  </p>
                  {notifyResult?.id === o.id && (
                    <p className="text-emerald-400 text-xs mt-1 font-medium">{notifyResult.msg}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => notify(o.id)} disabled={notifying === o.id}
                    className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-dt-border text-dt-text-2 hover:border-accent hover:text-accent disabled:opacity-50 transition-colors">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {notifying === o.id ? 'Enviando...' : 'Notificar'}
                  </button>
                  <button onClick={() => toggle(o.id, o.active)}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-dt-border text-dt-text-2 hover:bg-dt-bg-2 transition-colors">
                    {o.active ? 'Pausar' : 'Activar'}
                  </button>
                  <button onClick={() => del(o.id)}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-dt-border text-dt-text-2 hover:border-red-400 hover:text-red-400 transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

