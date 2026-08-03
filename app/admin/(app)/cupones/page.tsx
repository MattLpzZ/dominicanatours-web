'use client'
import { useState, useEffect } from 'react'

type CouponRow = { id: number; code: string; description: string | null; discountType: 'PERCENT'|'FIXED'; discountValue: number; maxUses: number | null; usedCount: number; expiresAt: string | null; active: boolean; createdAt: string }
const iCls = 'w-full px-3 py-2 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-sm focus:outline-none focus:border-accent'
const lCls = 'block text-xs font-semibold text-dt-text-2 mb-1'

export default function CuponesPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([])
  const [loading, setLoading] = useState(true)
  const [show,    setShow]    = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form, setForm] = useState({ code: '', description: '', discountType: 'PERCENT', discountValue: '10', minAmount: '', maxUses: '', expiresAt: '' })
  const s = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function load() {
    setLoading(true)
    const data = await fetch('/api/admin/cupones').then(r => r.json())
    setCoupons(data.coupons ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function create() {
    setSaving(true)
    const res = await fetch('/api/admin/cupones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code.trim().toUpperCase(),
        description: form.description || null,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minAmount: form.minAmount ? parseFloat(form.minAmount) : null,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt + 'T23:59:59').toISOString() : null,
      }),
    })
    if (res.ok) { setShow(false); setForm({ code: '', description: '', discountType: 'PERCENT', discountValue: '10', minAmount: '', maxUses: '', expiresAt: '' }); await load() }
    setSaving(false)
  }

  async function toggle(id: number, active: boolean) {
    await fetch(`/api/admin/cupones/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !active }) })
    await load()
  }

  async function del(id: number) {
    if (!confirm('¿Eliminar este cupón?')) return
    await fetch(`/api/admin/cupones/${id}`, { method: 'DELETE' })
    await load()
  }

  const isExpired = (c: CouponRow) => !!c.expiresAt && new Date(c.expiresAt) < new Date()
  const isExhausted = (c: CouponRow) => c.maxUses !== null && c.usedCount >= c.maxUses
  const status = (c: CouponRow) => !c.active ? 'Inactivo' : isExpired(c) ? 'Expirado' : isExhausted(c) ? 'Agotado' : 'Activo'
  const statusColor = (c: CouponRow) => !c.active || isExpired(c) || isExhausted(c) ? 'text-dt-text-3' : 'text-emerald-400'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-dt-text">Cupones</h1>
          <p className="text-dt-text-3 text-sm mt-0.5">Códigos de descuento para clientes</p>
        </div>
        <button onClick={() => setShow(v => !v)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          + Nuevo cupón
        </button>
      </div>

      {show && (
        <div className="bg-dt-surface border border-dt-border rounded-xl p-5 mb-6">
          <p className="font-semibold text-dt-text text-sm mb-4">Crear cupón</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lCls}>Código *</label>
              <input className={iCls} value={form.code} onChange={e => s('code', e.target.value.toUpperCase())} placeholder="PROMO20" />
            </div>
            <div>
              <label className={lCls}>Descripción</label>
              <input className={iCls} value={form.description} onChange={e => s('description', e.target.value)} placeholder="Promo de verano..." />
            </div>
            <div>
              <label className={lCls}>Tipo de descuento</label>
              <select className={iCls} value={form.discountType} onChange={e => s('discountType', e.target.value)}>
                <option value="PERCENT">Porcentaje (%)</option>
                <option value="FIXED">Monto fijo (USD)</option>
              </select>
            </div>
            <div>
              <label className={lCls}>Valor *</label>
              <input type="number" min="0" step="0.01" className={iCls} value={form.discountValue} onChange={e => s('discountValue', e.target.value)} placeholder={form.discountType === 'PERCENT' ? '20' : '10.00'} />
            </div>
            <div>
              <label className={lCls}>Mínimo de compra (USD)</label>
              <input type="number" min="0" className={iCls} value={form.minAmount} onChange={e => s('minAmount', e.target.value)} placeholder="50 (opcional)" />
            </div>
            <div>
              <label className={lCls}>Usos máximos</label>
              <input type="number" min="1" className={iCls} value={form.maxUses} onChange={e => s('maxUses', e.target.value)} placeholder="ilimitado" />
            </div>
            <div>
              <label className={lCls}>Expira</label>
              <input type="date" className={iCls} value={form.expiresAt} onChange={e => s('expiresAt', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={create} disabled={saving || !form.code || !form.discountValue} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity">
              {saving ? 'Creando...' : 'Crear cupón'}
            </button>
            <button onClick={() => setShow(false)} className="px-4 py-2 border border-dt-border text-dt-text-3 rounded-lg text-sm hover:text-dt-text transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-dt-surface rounded-xl border border-dt-border overflow-hidden">
        <div className="px-5 py-4 border-b border-dt-border flex items-center justify-between">
          <p className="font-semibold text-dt-text text-sm">Todos los cupones</p>
          <span className="text-xs text-dt-text-3 bg-dt-bg px-2.5 py-1 rounded-full border border-dt-border">{coupons.length}</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-dt-text-3 text-sm">Cargando...</div>
        ) : coupons.length === 0 ? (
          <div className="p-10 text-center"><p className="text-dt-text-3 text-sm">No hay cupones creados aún</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dt-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-dt-text-3 uppercase tracking-wide">Código</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-dt-text-3 uppercase tracking-wide hidden sm:table-cell">Descuento</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-dt-text-3 uppercase tracking-wide hidden md:table-cell">Usos</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-dt-text-3 uppercase tracking-wide">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-dt-border">
                {coupons.map(c => (
                  <tr key={c.id} className="hover:bg-dt-bg-2 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-mono font-bold text-dt-text text-sm tracking-wider">{c.code}</p>
                      {c.description && <p className="text-dt-text-3 text-xs mt-0.5">{c.description}</p>}
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="font-bold text-accent">
                        {c.discountType === 'PERCENT' ? `${c.discountValue}%` : `$${Number(c.discountValue).toFixed(0)}`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-dt-text-2 tabular-nums">
                        {c.usedCount}{c.maxUses !== null ? ` / ${c.maxUses}` : ' / ∞'}
                      </span>
                      {c.maxUses !== null && (
                        <div className="w-16 h-1 bg-dt-border rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(100, c.usedCount / c.maxUses * 100)}%` }} />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold ${statusColor(c)}`}>{status(c)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => toggle(c.id, c.active)} className={`text-xs px-2 py-0.5 rounded-full border font-semibold transition-colors ${c.active && !isExpired(c) && !isExhausted(c) ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : 'border-dt-border text-dt-text-3 hover:text-dt-text'}`}>
                          {c.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button onClick={() => del(c.id)} className="p-1 text-dt-text-3 hover:text-red-400 transition-colors rounded hover:bg-red-500/10">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
