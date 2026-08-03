'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Category = { id: number; name: string }
type Difficulty = 'EASY' | 'MODERATE' | 'ADVANCED'

interface Props { categories: Category[] }
interface CreatedTour { id: number; slug: string; name: string }

const SITE_URL = 'https://dominicana-tour.web.leymaken.com'
const iCls = 'w-full px-3 py-2 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-sm focus:outline-none focus:border-accent placeholder:text-dt-text-3'
const lCls = 'block text-xs font-semibold text-dt-text-2 mb-1'

export function TourQuickCreateBtn({ categories }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        + Nueva excursion
      </button>
      {open && <TourQuickCreateModal categories={categories} onClose={() => setOpen(false)} />}
    </>
  )
}

function TourQuickCreateModal({ categories, onClose }: Props & { onClose: () => void }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CreatedTour | null>(null)
  const [copied, setCopied] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  const blank = {
    name: '', subtitle: '', description: '',
    priceAdult: '', priceChild: '0',
    categoryId: String(categories[0]?.id ?? ''),
    difficulty: 'EASY' as Difficulty,
    departureZone: '', duration: '',
    active: true, featured: false,
  }
  const [form, setForm] = useState(blank)
  const s = (k: keyof typeof form, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => { setTimeout(() => firstInputRef.current?.focus(), 50) }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setCreated({ id: data.tour.id, slug: data.tour.slug, name: data.tour.name })
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setSaving(false)
    }
  }

  const publicUrl = created ? `${SITE_URL}/excursiones/${created.slug}` : ''

  async function copyUrl() {
    if (!publicUrl) return
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-dt-surface border border-dt-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dt-border shrink-0">
          <div>
            <h2 className="font-display font-bold text-dt-text text-lg">
              {created ? 'Excursion creada' : 'Nueva excursion'}
            </h2>
            {!created && <p className="text-dt-text-3 text-xs mt-0.5">Campos esenciales — edita detalles despues</p>}
          </div>
          <button onClick={onClose} className="text-dt-text-3 hover:text-dt-text p-1.5 rounded-lg hover:bg-dt-bg-2 transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {created ? (
            <div className="p-6 flex flex-col gap-4">
              {/* Success banner */}
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <svg className="w-6 h-6 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div>
                  <p className="text-emerald-400 font-semibold text-sm">{created.name}</p>
                  <p className="text-emerald-400/70 text-xs mt-0.5">Lista para publicar en redes sociales</p>
                </div>
              </div>

              {/* Copy link */}
              <div>
                <p className="text-xs font-semibold text-dt-text-3 mb-2">Enlace publico — comparte en redes</p>
                <div className="flex items-center gap-2 p-3 bg-dt-bg border border-dt-border rounded-xl">
                  <span className="flex-1 text-xs text-dt-text-2 font-mono truncate">{publicUrl}</span>
                  <button
                    onClick={copyUrl}
                    className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                      copied
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-white/5 border-dt-border text-dt-text-2 hover:border-accent hover:text-accent'
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        Copiado
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                        </svg>
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <a
                  href={`/admin/tours/${created.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Editar detalles
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
                <button
                  onClick={() => { setCreated(null); setSaving(false); setForm(blank) }}
                  className="px-4 py-2.5 border border-dt-border text-dt-text-2 rounded-xl text-sm hover:text-dt-text transition-colors"
                >
                  Crear otra
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} id="tour-quick-form" className="p-6 flex flex-col gap-4">
              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className={lCls}>Nombre *</label>
                <input ref={firstInputRef} className={iCls} value={form.name} onChange={e => s('name', e.target.value)} placeholder="27 Charcos de Damajagua" required />
              </div>

              <div>
                <label className={lCls}>Subtitulo *</label>
                <input className={iCls} value={form.subtitle} onChange={e => s('subtitle', e.target.value)} placeholder="La aventura de los charcos mas famosos del Caribe" required />
              </div>

              <div>
                <label className={lCls}>Descripcion *</label>
                <textarea className={iCls} rows={3} value={form.description} onChange={e => s('description', e.target.value)} placeholder="Descripcion completa del tour..." required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lCls}>Categoria *</label>
                  <select className={iCls} value={form.categoryId} onChange={e => s('categoryId', e.target.value)}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lCls}>Dificultad</label>
                  <select className={iCls} value={form.difficulty} onChange={e => s('difficulty', e.target.value as Difficulty)}>
                    <option value="EASY">Facil</option>
                    <option value="MODERATE">Moderado</option>
                    <option value="ADVANCED">Avanzado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lCls}>Precio adulto (USD) *</label>
                  <input type="number" step="0.01" min="0" className={iCls} value={form.priceAdult} onChange={e => s('priceAdult', e.target.value)} placeholder="75" required />
                </div>
                <div>
                  <label className={lCls}>Precio nino (USD)</label>
                  <input type="number" step="0.01" min="0" className={iCls} value={form.priceChild} onChange={e => s('priceChild', e.target.value)} placeholder="45" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lCls}>Zona de salida</label>
                  <input className={iCls} value={form.departureZone} onChange={e => s('departureZone', e.target.value)} placeholder="Punta Cana" />
                </div>
                <div>
                  <label className={lCls}>Duracion</label>
                  <input className={iCls} value={form.duration} onChange={e => s('duration', e.target.value)} placeholder="8 horas" />
                </div>
              </div>

              <div className="flex gap-5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.active} onChange={e => s('active', e.target.checked)} className="w-4 h-4 accent-accent rounded" />
                  <span className="text-sm text-dt-text-2">Activo (visible en sitio)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.featured} onChange={e => s('featured', e.target.checked)} className="w-4 h-4 accent-amber-400 rounded" />
                  <span className="text-sm text-dt-text-2">Destacado</span>
                </label>
              </div>
            </form>
          )}
        </div>

        {/* Footer — form only */}
        {!created && (
          <div className="px-6 py-4 border-t border-dt-border shrink-0 flex items-center gap-3">
            <button
              type="submit"
              form="tour-quick-form"
              disabled={saving || categories.length === 0}
              className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Creando...' : 'Crear excursion'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-dt-border text-dt-text-3 rounded-xl text-sm hover:text-dt-text transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
