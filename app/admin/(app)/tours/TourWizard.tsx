'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Types ─────────────────────────────────────────────────────────────────────
type Category = { id: number; name: string }
type Difficulty = 'EASY' | 'MODERATE' | 'ADVANCED'
type ItineraryItem = { id: number; time: string; title: string; description: string; order: number }
type TourInclude = { id: number; text: string; included: boolean }
type TourImage = { id: number; url: string; alt: string; order: number }

interface TourFields {
  name: string; subtitle: string; description: string
  priceAdult: string; priceChild: string; costPrice: string
  duration: string; difficulty: Difficulty
  categoryId: string; maxPeople: string; minAge: string
  departureZone: string; departureTime: string; languages: string
  active: boolean; featured: boolean; providerId: string
}

export interface TourWizardProps {
  mode: 'create' | 'edit'
  categories: Category[]
  initial?: Partial<TourFields> & { id?: number }
  initialItinerary?: ItineraryItem[]
  initialIncludes?: TourInclude[]
  initialImages?: TourImage[]
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const DIFFS: { v: Difficulty; label: string }[] = [
  { v: 'EASY', label: 'Fácil' },
  { v: 'MODERATE', label: 'Moderado' },
  { v: 'ADVANCED', label: 'Avanzado' },
]
const STEPS = ['Esencial', 'Logística', 'Contenido']
const iCls = 'w-full px-3 py-2 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-sm focus:outline-none focus:border-accent placeholder:text-dt-text-3 transition-colors'
const lCls = 'block text-xs font-semibold text-dt-text-2 mb-1'

// ─── Content Editor (shared between create step 3 and edit tab 3) ───────────────
function ContentEditor({
  tourId,
  initialItinerary = [],
  initialIncludes = [],
  initialImages = [],
}: {
  tourId: number
  initialItinerary?: ItineraryItem[]
  initialIncludes?: TourInclude[]
  initialImages?: TourImage[]
}) {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(initialItinerary)
  const [includes, setIncludes] = useState<TourInclude[]>(initialIncludes)
  const [images, setImages] = useState<TourImage[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [newItem, setNewItem] = useState({ time: '', title: '', description: '' })
  const [addingItem, setAddingItem] = useState(false)
  const [newInclude, setNewInclude] = useState({ text: '', included: true })
  const [addingInclude, setAddingInclude] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)


  async function addItineraryItem() {
    if (!newItem.title) return
    setAddingItem(true)
    const res = await fetch(`/api/admin/tours/${tourId}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, order: itinerary.length }),
      credentials: 'include',
    })
    const data = await res.json()
    if (data.ok) {
      setItinerary(prev => [...prev, data.item])
      setNewItem({ time: '', title: '', description: '' })
    }
    setAddingItem(false)
  }

  async function removeItineraryItem(id: number) {
    await fetch(`/api/admin/tours/${tourId}/itinerary?itemId=${id}`, { method: 'DELETE', credentials: 'include' })
    setItinerary(prev => prev.filter(x => x.id !== id))
  }

  async function addInclude() {
    if (!newInclude.text) return
    setAddingInclude(true)
    const res = await fetch(`/api/admin/tours/${tourId}/includes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInclude),
      credentials: 'include',
    })
    const data = await res.json()
    if (data.ok) {
      setIncludes(prev => [...prev, data.item])
      setNewInclude({ text: '', included: true })
    }
    setAddingInclude(false)
  }

  async function removeInclude(id: number) {
    await fetch(`/api/admin/tours/${tourId}/includes?itemId=${id}`, { method: 'DELETE', credentials: 'include' })
    setIncludes(prev => prev.filter(x => x.id !== id))
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const upRes = await fetch('/api/admin/upload', { method: 'POST', body: fd, credentials: 'include' })
    const upData = await upRes.json()
    if (upData.url) {
      const res = await fetch(`/api/admin/tours/${tourId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: upData.url, alt: file.name, order: images.length }),
        credentials: 'include',
      })
      const data = await res.json()
      if (data.ok) setImages(prev => [...prev, data.image])
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function removeImage(id: number) {
    await fetch(`/api/admin/tours/${tourId}/images?imageId=${id}`, { method: 'DELETE', credentials: 'include' })
    setImages(prev => prev.filter(x => x.id !== id))
  }

  const secCls = 'bg-dt-surface rounded-xl border border-dt-border p-5 space-y-4'

  return (
    <div className="space-y-5">
      {/* Itinerary */}
      <section className={secCls}>
        <h3 className="font-semibold text-dt-text text-sm">Itinerario ({itinerary.length})</h3>
        {itinerary.length > 0 && (
          <div className="space-y-2">
            {itinerary.map(item => (
              <div key={item.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-dt-border bg-dt-bg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.time && <span className="text-[11px] text-accent font-mono shrink-0">{item.time}</span>}
                    <span className="text-sm font-medium text-dt-text truncate">{item.title}</span>
                  </div>
                  {item.description && <p className="text-xs text-dt-text-3 mt-0.5 line-clamp-1">{item.description}</p>}
                </div>
                <button type="button" onClick={() => removeItineraryItem(item.id)} className="text-dt-text-3 hover:text-red-400 text-xs shrink-0 transition-colors">
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="border border-dt-border rounded-lg p-3 space-y-3 bg-dt-bg/40">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={lCls}>Hora</label>
              <input className={iCls} value={newItem.time} onChange={e => setNewItem(n => ({ ...n, time: e.target.value }))} placeholder="8:00 AM" />
            </div>
            <div className="col-span-2">
              <label className={lCls}>Actividad *</label>
              <input className={iCls} value={newItem.title} onChange={e => setNewItem(n => ({ ...n, title: e.target.value }))} placeholder="Salida desde el hotel" />
            </div>
          </div>
          <div>
            <label className={lCls}>Descripción</label>
            <input className={iCls} value={newItem.description} onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))} placeholder="Detalle opcional..." />
          </div>
          <button type="button" onClick={addItineraryItem} disabled={addingItem || !newItem.title}
            className="px-4 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
            {addingItem ? 'Agregando...' : '+ Agregar paso'}
          </button>
        </div>
      </section>

      {/* Includes / Excludes */}
      <section className={secCls}>
        <h3 className="font-semibold text-dt-text text-sm">Incluye / No incluye ({includes.length})</h3>
        {includes.length > 0 && (
          <div className="space-y-1.5">
            {includes.map(inc => (
              <div key={inc.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dt-border bg-dt-bg">
                <span className={`w-4 h-4 shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold ${inc.included ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {inc.included ? '✓' : '✗'}
                </span>
                <span className="flex-1 text-sm text-dt-text">{inc.text}</span>
                <button type="button" onClick={() => removeInclude(inc.id)} className="text-dt-text-3 hover:text-red-400 text-xs transition-colors">Eliminar</button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-dt-border overflow-hidden bg-dt-bg shrink-0">
            <button type="button" onClick={() => setNewInclude(n => ({ ...n, included: true }))}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${newInclude.included ? 'bg-emerald-500 text-white' : 'text-dt-text-3 hover:text-dt-text'}`}>
              Incluye
            </button>
            <button type="button" onClick={() => setNewInclude(n => ({ ...n, included: false }))}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${!newInclude.included ? 'bg-red-500 text-white' : 'text-dt-text-3 hover:text-dt-text'}`}>
              No incluye
            </button>
          </div>
          <input className={`flex-1 ${iCls}`} value={newInclude.text}
            onChange={e => setNewInclude(n => ({ ...n, text: e.target.value }))}
            placeholder="Transporte, almuerzo, guía..."
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInclude() } }} />
          <button type="button" onClick={addInclude} disabled={addingInclude || !newInclude.text}
            className="shrink-0 px-3 py-2 border border-dt-border text-dt-text-2 rounded-lg text-xs font-semibold hover:border-accent hover:text-accent disabled:opacity-50 transition-colors">
            {addingInclude ? '...' : 'Agregar'}
          </button>
        </div>
      </section>

      {/* Images */}
      <section className={secCls}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-dt-text text-sm">Fotos ({images.length})</h3>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
            {uploading ? 'Subiendo...' : '+ Subir foto'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadImage} />
        {images.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map(img => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden aspect-video border border-dt-border bg-dt-bg-2">
                <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(img.id)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-dt-text-3 text-sm text-center py-4">Sin fotos — sube la primera imagen</p>
        )}
      </section>
    </div>
  )
}

// ─── Main Wizard ────────────────────────────────────────────────────────────────
export default function TourWizard({
  mode, categories, initial = {}, initialItinerary = [], initialIncludes = [], initialImages = [],
}: TourWizardProps) {
  const router = useRouter()
  const isEdit = mode === 'edit'
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [catSearch, setCatSearch] = useState('')
  const [catOpen, setCatOpen]     = useState(false)
  const catRef = useRef<HTMLDivElement>(null)

  // close category dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState<number | null>(initial.id ?? null)

  const [providers, setProviders] = useState<{ id: number; name: string }[]>([])
  useEffect(() => {
    fetch('/api/admin/proveedores').then(r => r.json()).then(d => setProviders(d.providers ?? []))
  }, [])

  const [form, setForm] = useState<TourFields>({
    name: initial.name ?? '',
    subtitle: initial.subtitle ?? '',
    description: initial.description ?? '',
    priceAdult: initial.priceAdult ?? '',
    priceChild: initial.priceChild ?? '0',
    costPrice: initial.costPrice ?? '',
    duration: initial.duration ?? '',
    difficulty: (initial.difficulty as Difficulty) ?? 'EASY',
    categoryId: initial.categoryId ?? String(categories[0]?.id ?? ''),
    maxPeople: initial.maxPeople ?? '20',
    minAge: initial.minAge ?? '0',
    departureZone: initial.departureZone ?? '',
    departureTime: initial.departureTime ?? '8:00 AM',
    languages: initial.languages ?? 'Español, Inglés',
    active: initial.active ?? true,
    featured: initial.featured ?? false,
    providerId: String(initial.providerId ?? ''),
  })

  const s = (k: keyof TourFields, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  async function saveTour() {
    const id = createdId ?? initial.id
    const url = id ? `/api/admin/tours/${id}` : '/api/admin/tours'
    const method = id ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, providerId: form.providerId ? parseInt(form.providerId) : undefined }),
      credentials: 'include',
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
    return data
  }

  async function handleEsencialSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isEdit) {
      setSaving(true); setError(''); setSaved(false)
      try { await saveTour(); setSaved(true); setTimeout(() => setSaved(false), 2500) }
      catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error inesperado') }
      finally { setSaving(false) }
    } else {
      setStep(1)
    }
  }

  async function handleLogisticaSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    try {
      const data = await saveTour()
      if (isEdit) {
        setSaved(true); setTimeout(() => setSaved(false), 2500)
      } else {
        setCreatedId(data.tour.id)
        setStep(2)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  const tabOnClick = (i: number) => { setSaved(false); setError(''); setStep(i) }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl">
      {/* Progress (create) or Tabs (edit) */}
      {isEdit ? (
        <div className="flex border-b border-dt-border mb-6">
          {STEPS.map((label, i) => (
            <button key={i} type="button" onClick={() => tabOnClick(i)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${step === i ? 'border-accent text-accent' : 'border-transparent text-dt-text-3 hover:text-dt-text'}`}>
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? 'bg-accent text-white' : i === step ? 'bg-accent text-white ring-4 ring-accent/20' : 'bg-dt-bg border border-dt-border text-dt-text-3'}`}>
                  {i < step ? (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  ) : i + 1}
                </div>
                <span className={`text-[10px] font-semibold hidden sm:block ${i === step ? 'text-accent' : i < step ? 'text-dt-text-2' : 'text-dt-text-3'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-3.5 transition-colors ${i < step ? 'bg-accent' : 'bg-dt-border'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step 1 — Esencial */}
      {step === 0 && (
        <form onSubmit={handleEsencialSubmit} className="bg-dt-surface rounded-xl border border-dt-border p-5 space-y-4">
          <div>
            <label className={lCls}>Nombre *</label>
            <input className={iCls} value={form.name} onChange={e => s('name', e.target.value)} placeholder="27 Charcos de Damajagua" required />
          </div>
          <div>
            <label className={lCls}>Subtítulo *</label>
            <input className={iCls} value={form.subtitle} onChange={e => s('subtitle', e.target.value)} placeholder="La aventura de los charcos más famosos del Caribe" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div ref={catRef} className="relative">
              <label className={lCls}>Categoría *</label>
              <div
                className={`${iCls} flex items-center justify-between cursor-pointer select-none`}
                onClick={() => setCatOpen(o => !o)}
              >
                <span className={categories.find(c => String(c.id) === form.categoryId) ? '' : 'opacity-50'}>
                  {categories.find(c => String(c.id) === form.categoryId)?.name ?? 'Seleccionar...'}
                </span>
                <svg className={`w-4 h-4 text-dt-text-3 transition-transform shrink-0 ${catOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
              {catOpen && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-dt-surface border border-dt-border rounded-lg shadow-xl">
                  <input
                    type="text" autoFocus placeholder="Buscar categoría..."
                    className="w-full px-3 py-2 text-[13px] bg-dt-bg border-b border-dt-border text-dt-text focus:outline-none rounded-t-lg"
                    value={catSearch} onChange={e => setCatSearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="max-h-44 overflow-y-auto rounded-b-lg">
                    {categories
                      .filter(c => !catSearch || c.name.toLowerCase().includes(catSearch.toLowerCase()))
                      .map(c => (
                        <button key={c.id} type="button"
                          onClick={() => { s('categoryId', String(c.id)); setCatOpen(false); setCatSearch('') }}
                          className={`w-full text-left px-3 py-2 text-[13px] hover:bg-dt-bg-2 transition-colors ${String(c.id) === form.categoryId ? 'text-accent font-semibold' : 'text-dt-text'}`}>
                          {c.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className={lCls}>Dificultad</label>
              <select className={iCls} value={form.difficulty} onChange={e => s('difficulty', e.target.value as Difficulty)}>
                {DIFFS.map(d => <option key={d.v} value={d.v}>{d.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={lCls}>Descripción *</label>
            <textarea className={iCls} rows={5} value={form.description} onChange={e => s('description', e.target.value)} placeholder="Descripción completa del tour..." required />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving || categories.length === 0}
              className="px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? 'Guardando...' : saved ? '¡Guardado!' : isEdit ? 'Guardar cambios' : 'Continuar →'}
            </button>
            <Link href="/admin/tours" className="px-4 py-2.5 border border-dt-border text-dt-text-3 rounded-lg text-sm hover:text-dt-text transition-colors">
              {isEdit ? 'Cancelar' : 'Descartar'}
            </Link>
          </div>
        </form>
      )}

      {/* Step 2 — Logística */}
      {step === 1 && (
        <form onSubmit={handleLogisticaSubmit} className="bg-dt-surface rounded-xl border border-dt-border p-5 space-y-4">
          {error && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          {saved && isEdit && <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">Cambios guardados correctamente.</div>}

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={lCls}>Precio adulto (USD) *</label>
              <input type="number" step="0.01" min="0" className={iCls} value={form.priceAdult} onChange={e => s('priceAdult', e.target.value)} required />
            </div>
            <div>
              <label className={lCls}>Precio niño (USD)</label>
              <input type="number" step="0.01" min="0" className={iCls} value={form.priceChild} onChange={e => s('priceChild', e.target.value)} />
            </div>
            <div>
              <label className={lCls}>Costo proveedor (USD)</label>
              <input type="number" step="0.01" min="0" className={iCls} value={form.costPrice} onChange={e => s('costPrice', e.target.value)} placeholder="35.00" />
              <p className="text-[11px] text-dt-text-3 mt-1">Interno — no visible al cliente.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lCls}>Proveedor</label>
              <select className={iCls} value={form.providerId} onChange={e => s('providerId', e.target.value)}>
                <option value="">Sin proveedor asignado</option>
                {providers.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lCls}>Duración</label>
              <input className={iCls} value={form.duration} onChange={e => s('duration', e.target.value)} placeholder="8 horas" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={lCls}>Zona de salida</label>
              <input className={iCls} value={form.departureZone} onChange={e => s('departureZone', e.target.value)} placeholder="Punta Cana" />
            </div>
            <div>
              <label className={lCls}>Hora de salida</label>
              <input className={iCls} value={form.departureTime} onChange={e => s('departureTime', e.target.value)} placeholder="8:00 AM" />
            </div>
            <div>
              <label className={lCls}>Idiomas</label>
              <input className={iCls} value={form.languages} onChange={e => s('languages', e.target.value)} placeholder="Español, Inglés" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lCls}>Max. personas</label>
              <input type="number" min="1" className={iCls} value={form.maxPeople} onChange={e => s('maxPeople', e.target.value)} />
            </div>
            <div>
              <label className={lCls}>Edad mínima</label>
              <input type="number" min="0" className={iCls} value={form.minAge} onChange={e => s('minAge', e.target.value)} />
            </div>
          </div>

          <div className="flex gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.active} onChange={e => s('active', e.target.checked)} className="w-4 h-4 accent-accent rounded" />
              <span className="text-sm text-dt-text-2">Activo (visible en el sitio)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.featured} onChange={e => s('featured', e.target.checked)} className="w-4 h-4 accent-amber-400 rounded" />
              <span className="text-sm text-dt-text-2">Destacado (aparece en home)</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-1">
            {!isEdit && (
              <button type="button" onClick={() => setStep(0)}
                className="px-4 py-2.5 border border-dt-border text-dt-text-3 rounded-lg text-sm hover:text-dt-text transition-colors">
                ← Atrás
              </button>
            )}
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? 'Guardando...' : saved && isEdit ? '¡Guardado!' : isEdit ? 'Guardar cambios' : 'Crear excursión →'}
            </button>
            {isEdit && (
              <Link href="/admin/tours" className="px-4 py-2.5 border border-dt-border text-dt-text-3 rounded-lg text-sm hover:text-dt-text transition-colors">
                Cancelar
              </Link>
            )}
          </div>
        </form>
      )}

      {/* Step 3 — Contenido */}
      {step === 2 && (
        <div className="space-y-4">
          {!isEdit && (
            <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Tour creado. Agrega itinerario, fotos e incluidos — o complétalo después desde editar.
            </div>
          )}
          {createdId ? (
            <ContentEditor
              tourId={createdId}
              initialItinerary={initialItinerary}
              initialIncludes={initialIncludes}
              initialImages={initialImages}
            />
          ) : (
            <p className="text-dt-text-3 text-sm py-8 text-center">Crea el tour primero (paso 2)</p>
          )}
          {!isEdit && (
            <div className="flex items-center gap-3 pt-2">
              <Link href="/admin/tours" className="px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                Ir al listado
              </Link>
              {createdId && (
                <a href={`/admin/tours/${createdId}`} className="px-4 py-2.5 border border-dt-border text-dt-text-2 rounded-lg text-sm hover:text-dt-text transition-colors">
                  Editar completo
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
