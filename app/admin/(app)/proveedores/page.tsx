'use client'
import { useState, useEffect, useTransition } from 'react'

/* ??? Types ??? */
type Provider = {
  id: number; name: string; phone: string | null; email: string | null
  contactPerson: string | null; notes: string | null; active: boolean
  _count: { tours: number }
}
type PayableTour = {
  tourId: number; tourName: string; providerName: string
  costPrice: number | null; reservations: number; people: number
  totalCost: number | null
}
type PayableSummary = {
  providerId: number; providerName: string
  tours: PayableTour[]; totalReservations: number
  totalPeople: number; totalCost: number
}

/* ??? Icon helper ??? */
function Ico({ d, cls }: { d: string; cls?: string }) {
  return (
    <svg className={['w-4 h-4 shrink-0', cls].filter(Boolean).join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const ICONS = {
  building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  wa: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z M13 21.5a8.5 8.5 0 100-17 8.5 8.5 0 000 17z',
  plus: 'M12 4v16m8-8H4',
  edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  money: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  tour: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  check: 'M5 13l4 4L19 7',
  x: 'M6 18L18 6M6 6l12 12',
}

const lCls = 'block text-xs font-semibold text-dt-text-2 mb-1.5'
const iCls = 'w-full px-3 py-2 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-dt-text-3'

/* ??? Provider Modal ??? */
function ProviderModal({ provider, onClose, onSave }: {
  provider: Partial<Provider> | null; onClose: () => void; onSave: (p: Provider) => void
}) {
  const isEdit = !!(provider as Provider)?.id
  const [form, setForm] = useState({
    name: provider?.name ?? '', phone: provider?.phone ?? '',
    email: provider?.email ?? '', contactPerson: provider?.contactPerson ?? '',
    notes: provider?.notes ?? '', active: provider?.active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const s = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nombre requerido'); return }
    setSaving(true); setError('')
    const res = await fetch(isEdit ? `/api/admin/proveedores/${(provider as Provider).id}` : '/api/admin/proveedores', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Error'); setSaving(false); return }
    onSave(data.provider); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-dt-surface border border-dt-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-dt-border">
          <h2 className="text-[15px] font-semibold text-dt-text">{isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-dt-text-3 hover:text-dt-text hover:bg-dt-bg-2 transition-colors">
            <Ico d={ICONS.x} />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className={lCls}>Nombre *</label>
            <input value={form.name} onChange={e => s('name', e.target.value)} required className={iCls} placeholder="Turismo del Norte SRL" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lCls}>Tel?fono / WhatsApp</label>
              <input value={form.phone} onChange={e => s('phone', e.target.value)} className={iCls} placeholder="18091234567" />
            </div>
            <div>
              <label className={lCls}>Email</label>
              <input type="email" value={form.email} onChange={e => s('email', e.target.value)} className={iCls} placeholder="contacto@proveedor.com" />
            </div>
          </div>
          <div>
            <label className={lCls}>Persona de contacto</label>
            <input value={form.contactPerson} onChange={e => s('contactPerson', e.target.value)} className={iCls} placeholder="Juan Garc?a" />
          </div>
          <div>
            <label className={lCls}>Notas internas</label>
            <textarea rows={2} value={form.notes} onChange={e => s('notes', e.target.value)} className={iCls + ' resize-none'} placeholder="T?rminos de pago, descuentos, etc." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={e => s('active', e.target.checked)} className="w-4 h-4 accent-accent rounded" />
            <span className="text-sm text-dt-text-2">Proveedor activo</span>
          </label>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-accent text-white font-semibold text-sm rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors">
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear proveedor'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-dt-border text-dt-text-2 text-sm rounded-lg hover:bg-dt-bg-2 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ??? Providers tab ??? */
function ProveedoresTab({ initialProviders }: { initialProviders: Provider[] }) {
  const [providers, setProviders] = useState<Provider[]>(initialProviders)
  const [modal, setModal] = useState<Partial<Provider> | null | false>(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  function handleSave(p: Provider) {
    setProviders(prev => prev.find(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev])
  }

  async function toggle(p: Provider) {
    const res = await fetch(`/api/admin/proveedores/${p.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, active: !p.active }),
    })
    const data = await res.json()
    if (res.ok) setProviders(prev => prev.map(x => x.id === p.id ? data.provider : x))
  }

  async function del(id: number) {
    if (!confirm('?Eliminar este proveedor? Los tours quedar?n sin proveedor asignado.')) return
    setDeleting(id)
    const res = await fetch(`/api/admin/proveedores/${id}`, { method: 'DELETE' })
    if (res.ok) setProviders(prev => prev.filter(p => p.id !== id))
    else { const d = await res.json(); alert(d.error ?? 'Error') }
    setDeleting(null)
  }

  const activos = providers.filter(p => p.active).length

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: providers.length, color: 'text-dt-text' },
          { label: 'Activos', value: activos, color: 'text-emerald-400' },
          { label: 'Inactivos', value: providers.length - activos, color: 'text-dt-text-3' },
        ].map(s => (
          <div key={s.label} className="bg-dt-bg-2 border border-dt-border rounded-xl px-4 py-3">
            <p className="text-[11px] font-semibold text-dt-text-3 uppercase tracking-wide">{s.label}</p>
            <p className={['text-2xl font-bold mt-0.5', s.color].join(' ')}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-dt-text-3">Empresas y personas que proveen las excursiones.</p>
        <button onClick={() => setModal({})}
          className="flex items-center gap-2 bg-accent text-white text-[12px] font-semibold px-3 py-2 rounded-lg hover:bg-accent/90 transition-colors">
          <Ico d={ICONS.plus} cls="w-3.5 h-3.5" />
          Nuevo proveedor
        </button>
      </div>

      {/* Table */}
      <div className="border border-dt-border rounded-xl overflow-hidden">
        {providers.length === 0
          ? <div className="p-8 text-center text-dt-text-3 text-sm">Sin proveedores registrados.</div>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dt-border bg-dt-bg-2 text-[10px] uppercase tracking-wide text-dt-text-3 text-left">
                  <th className="px-4 py-2.5 font-medium">Proveedor</th>
                  <th className="px-4 py-2.5 font-medium hidden md:table-cell">Contacto</th>
                  <th className="px-4 py-2.5 font-medium text-center">Tours</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dt-border">
                {providers.map(p => (
                  <tr key={p.id} className="hover:bg-dt-bg-2 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-[13px] font-semibold text-dt-text">{p.name}</p>
                        {p.email && <p className="text-[11px] text-dt-text-3">{p.email}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {p.contactPerson && <p className="text-[12px] text-dt-text-2">{p.contactPerson}</p>}
                        {p.phone && (
                          <a href={`https://wa.me/${p.phone}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors">
                            <Ico d={ICONS.wa} cls="w-3 h-3" />{p.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[13px] font-bold text-dt-text">{p._count.tours}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggle(p)}
                        className={['text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors', p.active ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-dt-bg-2 text-dt-text-3 hover:bg-dt-border'].join(' ')}>
                        {p.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => setModal(p)}
                          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-dt-border text-dt-text-2 hover:border-accent hover:text-accent transition-colors">
                          Editar
                        </button>
                        <button onClick={() => del(p.id)} disabled={deleting === p.id}
                          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-dt-border text-dt-text-2 hover:border-red-400 hover:text-red-400 disabled:opacity-50 transition-colors">
                          {deleting === p.id ? '...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>

      {modal !== false && (
        <ProviderModal provider={modal} onClose={() => setModal(false)} onSave={handleSave} />
      )}
    </div>
  )
}

/* ??? Cuentas por pagar tab ??? */
function CuentasTab() {
  const [data, setData] = useState<PayableSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => {
    const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
  })
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/proveedores/cuentas?month=${month}`)
      .then(r => r.json())
      .then(d => { setData(d.payables ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [month])

  const totalGeneral = data.reduce((s, p) => s + p.totalCost, 0)
  const fmt = (n: number) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

  // Month options: current + 5 previous
  const months: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('es-DO', { month: 'long', year: 'numeric' }),
    })
  }

  return (
    <div className="space-y-5">
      {/* Filters + total */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-[12px] font-semibold text-dt-text-2">Per?odo:</label>
          <select value={month} onChange={e => setMonth(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-sm focus:outline-none focus:border-accent">
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        {!loading && data.length > 0 && (
          <div className="text-right">
            <p className="text-[11px] text-dt-text-3 uppercase tracking-wide font-semibold">Total a pagar</p>
            <p className="text-xl font-bold text-dt-text">{fmt(totalGeneral)}</p>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 gap-2 text-dt-text-3 text-sm">
          <span className="w-4 h-4 border-2 border-dt-border border-t-accent rounded-full animate-spin" />
          Cargando...
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="text-center py-12 text-dt-text-3 text-sm">
          Sin cuentas a pagar para este per?odo.<br />
          <span className="text-[12px]">Aseg?rate de asignar proveedor y precio de costo a los tours.</span>
        </div>
      )}

      {!loading && data.map(p => (
        <div key={p.providerId} className="border border-dt-border rounded-xl overflow-hidden">
          {/* Provider header row */}
          <button
            onClick={() => setExpanded(expanded === p.providerId ? null : p.providerId)}
            className="w-full flex items-center justify-between px-5 py-4 bg-dt-bg-2 hover:bg-dt-surface transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Ico d={ICONS.building} cls="text-accent" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-dt-text">{p.providerName}</p>
                <p className="text-[11px] text-dt-text-3">{p.tours.length} tour{p.tours.length !== 1 ? 's' : ''} ? {p.totalReservations} reserva{p.totalReservations !== 1 ? 's' : ''} ? {p.totalPeople} persona{p.totalPeople !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[11px] text-dt-text-3 font-semibold">A pagar</p>
                <p className="text-[16px] font-bold text-amber-400">{fmt(p.totalCost)}</p>
              </div>
              <svg className={['w-4 h-4 text-dt-text-3 transition-transform', expanded === p.providerId ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 9l-7 7-7-7"/></svg>
            </div>
          </button>

          {/* Tour breakdown */}
          {expanded === p.providerId && (
            <div className="divide-y divide-dt-border">
              <div className="grid grid-cols-5 px-5 py-2 text-[10px] uppercase tracking-wide text-dt-text-3 font-medium bg-dt-bg">
                <span className="col-span-2">Tour</span>
                <span className="text-center">Reservas</span>
                <span className="text-center">Personas</span>
                <span className="text-right">Costo total</span>
              </div>
              {p.tours.map(t => (
                <div key={t.tourId} className="grid grid-cols-5 px-5 py-3 items-center hover:bg-dt-bg-2 transition-colors">
                  <div className="col-span-2">
                    <p className="text-[13px] font-semibold text-dt-text">{t.tourName}</p>
                    {t.costPrice !== null
                      ? <p className="text-[11px] text-dt-text-3">{fmt(t.costPrice)} / persona</p>
                      : <p className="text-[11px] text-amber-400">Sin precio de costo</p>
                    }
                  </div>
                  <p className="text-[13px] font-semibold text-dt-text text-center">{t.reservations}</p>
                  <p className="text-[13px] font-semibold text-dt-text text-center">{t.people}</p>
                  <p className={['text-[13px] font-bold text-right', t.totalCost !== null ? 'text-dt-text' : 'text-dt-text-3'].join(' ')}>
                    {t.totalCost !== null ? fmt(t.totalCost) : '?'}
                  </p>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-3 bg-amber-500/5 border-t border-amber-500/20">
                <p className="text-[12px] font-semibold text-amber-400">Total {p.providerName}</p>
                <p className="text-[15px] font-bold text-amber-400">{fmt(p.totalCost)}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ??? Main page ??? */
const TABS = [
  { key: 'proveedores', label: 'Proveedores', icon: ICONS.building },
  { key: 'cuentas',     label: 'Cuentas por pagar', icon: ICONS.money },
]

export default function ProveedoresPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [tab, setTab] = useState<'proveedores' | 'cuentas'>('proveedores')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/proveedores')
      .then(r => r.json())
      .then(d => { setProviders(d.providers ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-dt-text">Proveedores</h1>
        <p className="text-sm text-dt-text-3 mt-0.5">Empresas y personas que proveen excursiones. Controla costos y cuentas por pagar.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-dt-border">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={['flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors', tab === t.key ? 'border-accent text-accent' : 'border-transparent text-dt-text-3 hover:text-dt-text'].join(' ')}>
            <Ico d={t.icon} cls="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-dt-text-3 text-sm">
          <span className="w-4 h-4 border-2 border-dt-border border-t-accent rounded-full animate-spin" />
          Cargando...
        </div>
      ) : (
        <div>
          {tab === 'proveedores' && <ProveedoresTab initialProviders={providers} />}
          {tab === 'cuentas' && <CuentasTab />}
        </div>
      )}
    </div>
  )
}

