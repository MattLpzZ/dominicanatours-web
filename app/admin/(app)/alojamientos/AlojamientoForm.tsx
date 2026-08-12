'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────────────────────
type AccomImage = { id: number; url: string; alt?: string | null; sortOrder?: number | null }

interface AccomFields {
  name: string; type: string; stars: string
  shortDescription: string; description: string
  province: string; address: string
  priceMin: string; priceMax: string
  phone: string; email: string; website: string; bookingUrl: string
  amenities: string; coverImage: string
  featured: boolean; comingSoon: boolean; active: boolean
}

export interface AlojamientoFormProps {
  mode: 'create' | 'edit'
  initial?: Partial<AccomFields> & { id?: number }
  initialImages?: AccomImage[]
}

// ─── Constants ───────────────────────────────────────────────────────────────
const TYPES = ['hotel', 'resort', 'villa', 'apartamento', 'hostel', 'casa-rural', 'otro']
const STEPS = ['Esencial', 'Logística', 'Fotos']
const iCls = 'w-full px-3 py-2 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-sm focus:outline-none focus:border-accent placeholder:text-dt-text-3 transition-colors'
const lCls = 'block text-xs font-semibold text-dt-text-2 mb-1'

// ─── Gallery Editor ──────────────────────────────────────────────────────────
function GalleryEditor({ accomId, initial }: { accomId: number; initial: AccomImage[] }) {
  const [images, setImages] = useState<AccomImage[]>(initial)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const upRes = await fetch('/api/admin/upload', { method: 'POST', body: fd, credentials: 'include' })
    const upData = await upRes.json()
    if (upData.url) {
      const res = await fetch(`/api/admin/alojamientos/${accomId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: upData.url, alt: file.name, sortOrder: images.length }),
        credentials: 'include',
      })
      const data = await res.json()
      if (data.ok) setImages(prev => [...prev, data.image])
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function removeImage(id: number) {
    await fetch(`/api/admin/alojamientos/${accomId}/images?imageId=${id}`, { method: 'DELETE', credentials: 'include' })
    setImages(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-dt-text text-sm">Galería de fotos ({images.length})</h3>
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
              <img src={img.url} alt={img.alt ?? ''} className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeImage(img.id)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                Eliminar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-dt-text-3 text-sm text-center py-6">Sin fotos — sube la primera imagen</p>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AlojamientoForm({ mode, initial = {}, initialImages = [] }: AlojamientoFormProps) {
  const isEdit = mode === 'edit'
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState<number | null>(initial.id ?? null)

  const [form, setForm] = useState<AccomFields>({
    name: initial.name ?? '',
    type: initial.type ?? 'hotel',
    stars: initial.stars ?? '',
    shortDescription: initial.shortDescription ?? '',
    description: initial.description ?? '',
    province: initial.province ?? '',
    address: initial.address ?? '',
    priceMin: initial.priceMin ?? '',
    priceMax: initial.priceMax ?? '',
    phone: initial.phone ?? '',
    email: initial.email ?? '',
    website: initial.website ?? '',
    bookingUrl: initial.bookingUrl ?? '',
    amenities: initial.amenities ?? '',
    coverImage: initial.coverImage ?? '',
    featured: initial.featured ?? false,
    comingSoon: initial.comingSoon ?? false,
    active: initial.active ?? true,
  })

  const s = (k: keyof AccomFields, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  async function saveAccom() {
    const id = createdId ?? initial.id
    const url = id ? `/api/admin/alojamientos/${id}` : '/api/admin/alojamientos'
    const res = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
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
      try { await saveAccom(); setSaved(true); setTimeout(() => setSaved(false), 2500) }
      catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error') }
      finally { setSaving(false) }
    } else {
      setStep(1)
    }
  }

  async function handleLogisticaSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    try {
      const data = await saveAccom()
      if (isEdit) {
        setSaved(true); setTimeout(() => setSaved(false), 2500)
      } else {
        setCreatedId(data.accommodation.id)
        setStep(2)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  const tabClick = (i: number) => { setSaved(false); setError(''); setStep(i) }

  return (
    <div className="max-w-3xl">
      {/* Tabs / Progress */}
      {isEdit ? (
        <div className="flex border-b border-dt-border mb-6">
          {STEPS.map((label, i) => (
            <button key={i} type="button" onClick={() => tabClick(i)}
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
            <input className={iCls} value={form.name} onChange={e => s('name', e.target.value)} placeholder="Hotel Palma Real" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lCls}>Tipo</label>
              <select className={iCls} value={form.type} onChange={e => s('type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={lCls}>Estrellas</label>
              <select className={iCls} value={form.stars} onChange={e => s('stars', e.target.value)}>
                <option value="">Sin clasificar</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} estrella{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={lCls}>Descripción corta</label>
            <input className={iCls} value={form.shortDescription} onChange={e => s('shortDescription', e.target.value)} placeholder="Breve descripción para listados..." maxLength={200} />
          </div>
          <div>
            <label className={lCls}>Descripción completa</label>
            <textarea className={iCls} rows={5} value={form.description} onChange={e => s('description', e.target.value)} placeholder="Descripción detallada del alojamiento..." />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? 'Guardando...' : saved ? '¡Guardado!' : isEdit ? 'Guardar cambios' : 'Continuar →'}
            </button>
            <Link href="/admin/alojamientos" className="px-4 py-2.5 border border-dt-border text-dt-text-3 rounded-lg text-sm hover:text-dt-text transition-colors">
              {isEdit ? 'Cancelar' : 'Descartar'}
            </Link>
          </div>
        </form>
      )}

      {/* Step 2 — Logística */}
      {step === 1 && (
        <form onSubmit={handleLogisticaSubmit} className="bg-dt-surface rounded-xl border border-dt-border p-5 space-y-4">
          {error && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          {saved && isEdit && <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">Cambios guardados.</div>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lCls}>Provincia</label>
              <input className={iCls} value={form.province} onChange={e => s('province', e.target.value)} placeholder="La Altagracia" />
            </div>
            <div>
              <label className={lCls}>Dirección</label>
              <input className={iCls} value={form.address} onChange={e => s('address', e.target.value)} placeholder="Calle principal, Punta Cana" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lCls}>Precio desde (USD)</label>
              <input type="number" step="0.01" min="0" className={iCls} value={form.priceMin} onChange={e => s('priceMin', e.target.value)} placeholder="80.00" />
            </div>
            <div>
              <label className={lCls}>Precio hasta (USD)</label>
              <input type="number" step="0.01" min="0" className={iCls} value={form.priceMax} onChange={e => s('priceMax', e.target.value)} placeholder="350.00" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={lCls}>Teléfono</label>
              <input className={iCls} value={form.phone} onChange={e => s('phone', e.target.value)} placeholder="+1 809 000 0000" />
            </div>
            <div>
              <label className={lCls}>Email</label>
              <input type="email" className={iCls} value={form.email} onChange={e => s('email', e.target.value)} placeholder="info@hotel.com" />
            </div>
            <div>
              <label className={lCls}>Sitio web</label>
              <input className={iCls} value={form.website} onChange={e => s('website', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div>
            <label className={lCls}>Link de reserva</label>
            <input className={iCls} value={form.bookingUrl} onChange={e => s('bookingUrl', e.target.value)} placeholder="https://booking.com/..." />
          </div>

          <div>
            <label className={lCls}>Comodidades</label>
            <input className={iCls} value={form.amenities} onChange={e => s('amenities', e.target.value)} placeholder="Piscina, WiFi, Desayuno, Spa, Restaurante" />
            <p className="text-[11px] text-dt-text-3 mt-1">Separadas por coma</p>
          </div>

          <div className="flex gap-5 flex-wrap pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.active} onChange={e => s('active', e.target.checked)} className="w-4 h-4 accent-accent rounded" />
              <span className="text-sm text-dt-text-2">Activo (visible)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.featured} onChange={e => s('featured', e.target.checked)} className="w-4 h-4 accent-amber-400 rounded" />
              <span className="text-sm text-dt-text-2">Destacado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.comingSoon} onChange={e => s('comingSoon', e.target.checked)} className="w-4 h-4 accent-dt-text-3 rounded" />
              <span className="text-sm text-dt-text-2">Próximamente</span>
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
              {saving ? 'Guardando...' : saved && isEdit ? '¡Guardado!' : isEdit ? 'Guardar cambios' : 'Crear alojamiento →'}
            </button>
            {isEdit && (
              <Link href="/admin/alojamientos" className="px-4 py-2.5 border border-dt-border text-dt-text-3 rounded-lg text-sm hover:text-dt-text transition-colors">
                Cancelar
              </Link>
            )}
          </div>
        </form>
      )}

      {/* Step 3 — Fotos */}
      {step === 2 && (
        <div className="space-y-4">
          {!isEdit && (
            <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Alojamiento creado. Agrega las fotos ahora o complétalo después.
            </div>
          )}

          {/* Cover image field */}
          <div className="bg-dt-surface rounded-xl border border-dt-border p-5 space-y-3">
            <h3 className="font-semibold text-dt-text text-sm">Imagen principal</h3>
            <div>
              <label className={lCls}>URL de portada</label>
              <input className={iCls} value={form.coverImage} onChange={e => s('coverImage', e.target.value)} placeholder="https://... o /uploads/imagen.jpg" />
            </div>
            {form.coverImage && (
              <div className="rounded-lg overflow-hidden border border-dt-border h-40">
                <img src={form.coverImage} alt="Portada" className="w-full h-full object-cover" />
              </div>
            )}
            {isEdit && createdId && (
              <button type="button" onClick={async () => {
                setSaving(true)
                try { await saveAccom(); setSaved(true); setTimeout(() => setSaved(false), 2000) }
                catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error') }
                finally { setSaving(false) }
              }} disabled={saving}
                className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar portada'}
              </button>
            )}
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>

          {/* Gallery */}
          {createdId && (
            <div className="bg-dt-surface rounded-xl border border-dt-border p-5">
              <GalleryEditor accomId={createdId} initial={initialImages} />
            </div>
          )}

          {!isEdit && (
            <div className="flex items-center gap-3 pt-2">
              <Link href="/admin/alojamientos" className="px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                Ir al listado
              </Link>
              {createdId && (
                <a href={`/admin/alojamientos/${createdId}`} className="px-4 py-2.5 border border-dt-border text-dt-text-2 rounded-lg text-sm hover:text-dt-text transition-colors">
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
