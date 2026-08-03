"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Category = { id: number; name: string }
type Difficulty = 'EASY' | 'MODERATE' | 'ADVANCED'
interface TourData {
  name: string; subtitle: string; description: string
  priceAdult: string; priceChild: string; costPrice: string; duration: string; difficulty: Difficulty
  categoryId: string; maxPeople: string; minAge: string
  departureZone: string; departureTime: string; languages: string
  active: boolean; featured: boolean
  providerId?: string
}
interface Props { categories: Category[]; initial?: Partial<TourData> & { id?: number } }
const DIFFS = [{ v:'EASY',label:'Facil' },{ v:'MODERATE',label:'Moderado' },{ v:'ADVANCED',label:'Avanzado' }]
const iCls = "w-full px-3 py-2 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-sm focus:outline-none focus:border-accent placeholder:text-dt-text-3"
const lCls = "block text-xs font-semibold text-dt-text-2 mb-1"

export default function TourForm({ categories, initial }: Props) {
  const router = useRouter()
  const isEdit = !!initial?.id
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<TourData>({
    name: initial?.name ?? '', subtitle: initial?.subtitle ?? '',
    description: initial?.description ?? '', priceAdult: initial?.priceAdult ?? '',
    priceChild: initial?.priceChild ?? '0', costPrice: initial?.costPrice ?? '',
    providerId: String(initial?.providerId ?? ''), duration: initial?.duration ?? '',
    difficulty: (initial?.difficulty as Difficulty) ?? 'EASY',
    categoryId: initial?.categoryId ?? String(categories[0]?.id ?? ''),
    maxPeople: initial?.maxPeople ?? '20', minAge: initial?.minAge ?? '0',
    departureZone: initial?.departureZone ?? '', departureTime: initial?.departureTime ?? '8:00 AM',
    languages: initial?.languages ?? 'Espanol, Ingles',
    active: initial?.active ?? true, featured: initial?.featured ?? false,
  })
  const [providers, setProviders] = useState<{ id: number; name: string }[]>([])
  useEffect(() => {
    fetch('/api/admin/proveedores').then(r => r.json()).then(d => setProviders(d.providers ?? []))
  }, [])
  const s = (k: keyof TourData, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(''); setSaved(false)
    try {
      const url = isEdit ? `/api/admin/tours/${initial!.id}` : '/api/admin/tours'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, providerId: form.providerId ? parseInt(form.providerId) : undefined }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setSaved(true)
      setTimeout(() => {
        router.push('/admin/tours')
        router.refresh()
      }, 800)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {saved && (
        <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          Guardado correctamente. Redirigiendo...
        </div>
      )}

      <section className="bg-dt-surface rounded-xl border border-dt-border p-5">
        <h2 className="font-semibold text-dt-text text-sm mb-4">Informacion basica</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={lCls}>Nombre *</label>
            <input className={iCls} value={form.name} onChange={e=>s('name',e.target.value)} placeholder="27 Charcos de Damajagua" required />
          </div>
          <div className="sm:col-span-2">
            <label className={lCls}>Subtitulo *</label>
            <input className={iCls} value={form.subtitle} onChange={e=>s('subtitle',e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <label className={lCls}>Descripcion *</label>
            <textarea className={iCls} rows={4} value={form.description} onChange={e=>s('description',e.target.value)} required />
          </div>
          <div>
            <label className={lCls}>Categoria *</label>
            <select className={iCls} value={form.categoryId} onChange={e=>s('categoryId',e.target.value)}>
              {categories.length === 0 && <option value="">Sin categorias</option>}
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lCls}>Dificultad</label>
            <select className={iCls} value={form.difficulty} onChange={e=>s('difficulty',e.target.value as Difficulty)}>
              {DIFFS.map(d => <option key={d.v} value={d.v}>{d.label}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-dt-surface rounded-xl border border-dt-border p-5">
        <h2 className="font-semibold text-dt-text text-sm mb-4">Precios y capacidad</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={lCls}>Precio adulto (USD) *</label>
            <input type="number" step="0.01" min="0" className={iCls} value={form.priceAdult} onChange={e=>s('priceAdult',e.target.value)} required />
          </div>
          <div>
            <label className={lCls}>Precio nino (USD)</label>
            <input type="number" step="0.01" min="0" className={iCls} value={form.priceChild} onChange={e=>s('priceChild',e.target.value)} />
          </div>
          <div>
            <label className={lCls}>Costo proveedor (USD)</label>
            <input type="number" step="0.01" min="0" className={iCls} value={form.costPrice} onChange={e=>s('costPrice',e.target.value)} placeholder="35.00" />
            <p className="text-[11px] text-dt-text-3 mt-1">Precio interno ? no visible al cliente.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dt-text-2 mb-1.5">Proveedor</label>
            <select
              value={form.providerId}
              onChange={e => setForm(f => ({ ...f, providerId: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-sm focus:outline-none focus:border-accent transition-colors"
            >
              <option value="">Sin proveedor asignado</option>
              {providers.map(p => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-dt-text-3 mt-1">Proveedor que ofrece esta excursi?n.</p>
          </div>          <div>
            <label className={lCls}>Max personas</label>
            <input type="number" min="1" className={iCls} value={form.maxPeople} onChange={e=>s('maxPeople',e.target.value)} />
          </div>
          <div>
            <label className={lCls}>Edad minima</label>
            <input type="number" min="0" className={iCls} value={form.minAge} onChange={e=>s('minAge',e.target.value)} />
          </div>
          <div>
            <label className={lCls}>Duracion</label>
            <input className={iCls} value={form.duration} onChange={e=>s('duration',e.target.value)} placeholder="8 horas" />
          </div>
        </div>
      </section>

      <section className="bg-dt-surface rounded-xl border border-dt-border p-5">
        <h2 className="font-semibold text-dt-text text-sm mb-4">Logistica</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={lCls}>Zona de salida</label>
            <input className={iCls} value={form.departureZone} onChange={e=>s('departureZone',e.target.value)} placeholder="Punta Cana" />
          </div>
          <div>
            <label className={lCls}>Hora de salida</label>
            <input className={iCls} value={form.departureTime} onChange={e=>s('departureTime',e.target.value)} placeholder="8:00 AM" />
          </div>
          <div className="sm:col-span-2">
            <label className={lCls}>Idiomas disponibles</label>
            <input className={iCls} value={form.languages} onChange={e=>s('languages',e.target.value)} placeholder="Espanol, Ingles" />
          </div>
        </div>
      </section>

      <section className="bg-dt-surface rounded-xl border border-dt-border p-5">
        <h2 className="font-semibold text-dt-text text-sm mb-4">Visibilidad</h2>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.active} onChange={e=>s('active',e.target.checked)} className="w-4 h-4 accent-accent rounded" />
            <span className="text-sm text-dt-text-2">Activo (visible en el sitio)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.featured} onChange={e=>s('featured',e.target.checked)} className="w-4 h-4 accent-amber-400 rounded" />
            <span className="text-sm text-dt-text-2">Destacado (aparece en home)</span>
          </label>
        </div>
      </section>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || saved || categories.length === 0}
          className="px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Guardando...' : saved ? 'Guardado!' : isEdit ? 'Guardar cambios' : 'Crear excursion'}
        </button>
        <Link href="/admin/tours" className="px-4 py-2.5 border border-dt-border text-dt-text-3 rounded-lg text-sm hover:text-dt-text transition-colors">
          Cancelar
        </Link>
        {categories.length === 0 && (
          <span className="text-red-400 text-xs">No hay categorias en el sistema</span>
        )}
      </div>
    </form>
  )
}