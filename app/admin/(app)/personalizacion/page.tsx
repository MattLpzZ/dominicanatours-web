'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from 'next-themes'

type Banner = { tag: string; title: string; accent?: string; sub: string; btn_text: string; btn_url: string }
type Stat = { n: string; label: string }
type Testimonial = { name: string; origin: string; tour: string; text: string }

const DEFAULT_BANNERS: [Banner, Banner] = [
  { tag: 'Descuento grupal', title: 'VIAJAN 4 O MÁS', accent: '20% DESCUENTO', sub: 'Se aplica automáticamente al reservar. Sin código. Aplica a todos los tours.', btn_text: 'Ver excursiones', btn_url: '/excursiones' },
  { tag: 'Disponible ahora', title: 'Tour privado · Solo tu grupo', sub: 'Mismos destinos, guía dedicado. Para familias, parejas o empresas.', btn_text: 'Cotizar ahora', btn_url: '' },
]
const DEFAULT_STATS: Stat[] = [
  { n: '820+', label: 'viajeros satisfechos' },
  { n: '50+',  label: 'excursiones únicas' },
  { n: '4.9',  label: 'calificación promedio' },
  { n: '24/7', label: 'soporte en español' },
]
const DEFAULT_ANNOUNCE = [
  'Traslados incluidos en todos los tours',
  'Grupos máx. 15 personas',
  'Cancelación gratuita hasta 48h antes',
]
const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { name: 'María y Javier', origin: 'España',  tour: 'Tour de Ballenas Jorobadas', text: 'El momento más mágico de nuestro viaje de bodas. Los guías son apasionados y el servicio impecable.' },
  { name: 'David Chen',     origin: 'EE.UU',   tour: 'Cascadas El Limón',          text: 'Amazing experience! The guides speak English perfectly and the organization was flawless. 100% recommended.' },
  { name: 'Amélie Dubois',  origin: 'Francia', tour: 'Lago Enriquillo',            text: 'Incroyable! On a vu des crocodiles et des iguanes géants. Une excursion à ne surtout pas manquer.' },
]

const TABS = [
  { id: 'hero',      label: 'Hero' },
  { id: 'banners',   label: 'Banners' },
  { id: 'stats',     label: 'Estadísticas' },
  { id: 'announce',  label: 'Barra de anuncios' },
  { id: 'testimonials', label: 'Testimonios' },
  { id: 'general',   label: 'General' },
]

function Input({ value, onChange, placeholder, className = '' }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full px-3 py-2 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#F7F7F7] dark:bg-[#1A1A1A] text-[#111111] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#525252] outline-none focus:border-[#1d70b7] transition-colors ${className}`}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#F7F7F7] dark:bg-[#1A1A1A] text-[#111111] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#525252] outline-none focus:border-[#1d70b7] transition-colors resize-none"
    />
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#374151] dark:text-[#D1D5DB] mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[#9CA3AF] dark:text-[#525252] mt-1">{hint}</p>}
    </div>
  )
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#1F1F1F] rounded-xl p-5 space-y-4">
      {title && <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#737373]">{title}</h3>}
      {children}
    </div>
  )
}

function SaveRow({ id, saves, onSave }: { id: string; saves: Record<string, { saving: boolean; saved: boolean; error: string }>; onSave: () => void }) {
  const s = saves[id] ?? { saving: false, saved: false, error: '' }
  return (
    <div className="flex items-center gap-3 pt-2">
      <button onClick={onSave} disabled={s.saving}
        className="flex items-center gap-2 px-5 py-2 bg-[#1d70b7] text-white text-[13px] font-bold rounded-lg disabled:opacity-50 transition-opacity">
        {s.saving
          ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>
          : <>Guardar cambios</>}
      </button>
      {s.saved && <span className="text-[12px] text-green-500 font-medium">Guardado</span>}
      {s.error && <span className="text-[12px] text-red-500">{s.error}</span>}
    </div>
  )
}

function ImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) onChange(data.url)
    } catch {}
    finally { setUploading(false) }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={value} onChange={onChange} placeholder="https://... o /uploads/imagen.jpg" />
        <button onClick={() => ref.current?.click()} disabled={uploading}
          className="shrink-0 px-3 py-2 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] text-[12px] font-semibold text-[#6B7280] dark:text-[#737373] hover:border-[#1d70b7] hover:text-[#1d70b7] transition-colors disabled:opacity-50">
          {uploading ? 'Subiendo...' : 'Subir'}
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="preview" className="h-24 w-full object-cover rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A]" />
      )}
    </div>
  )
}

export default function PersonalizacionPage() {
  const [tab, setTab] = useState('hero')
  const [loading, setLoading] = useState(true)
  const [saves, setSaves] = useState<Record<string, { saving: boolean; saved: boolean; error: string }>>({})

  // Hero
  const [heroTitle, setHeroTitle]     = useState('')
  const [heroSub, setHeroSub]         = useState('')
  const [heroCta, setHeroCta]         = useState('')
  const [heroCtaUrl, setHeroCtaUrl]   = useState('/excursiones')
  const [heroBg, setHeroBg]           = useState('')

  // Banners
  const [banners, setBanners] = useState<[Banner, Banner]>(DEFAULT_BANNERS)

  // Stats
  const [stats, setStats] = useState<Stat[]>(DEFAULT_STATS)

  // Announce
  const [announce, setAnnounce] = useState<string[]>(DEFAULT_ANNOUNCE)

  // Testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS)

  // Theme
  const { theme, setTheme } = useTheme()
  const [accent, setAccent]   = useState('#1d70b7')
  const [customHex, setCustomHex] = useState('#1d70b7')

  // General
  const [businessName, setBusinessName]   = useState('')
  const [waNumber, setWaNumber]           = useState('')
  const [waMessage, setWaMessage]         = useState('')
  const [contactEmail, setContactEmail]   = useState('')
  const [bizHours, setBizHours]           = useState('')
  const [whyCta, setWhyCta]               = useState('')
  const [whyCtaText, setWhyCtaText]       = useState('')
  const [nosotrosImg, setNosotrosImg]     = useState('')

  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => r.json())
      .then((d: Record<string, string>) => {
        setHeroTitle(d.hero_title ?? '')
        setHeroSub(d.hero_subtitle ?? '')
        setHeroCta(d.hero_cta ?? '')
        setHeroCtaUrl(d.hero_cta_url ?? '/excursiones')
        setHeroBg(d.hero_bg_image ?? '')
        if (d.accent_color) {
          setAccent(d.accent_color)
          setCustomHex(d.accent_color)
          document.documentElement.style.setProperty('--color-accent', d.accent_color)
        }
        try { if (d.banners_config) setBanners(JSON.parse(d.banners_config)) } catch {}
        try { if (d.stats_config)   setStats(JSON.parse(d.stats_config))     } catch {}
        try { if (d.announce_config) setAnnounce(JSON.parse(d.announce_config)) } catch {}
        try { if (d.testimonials_config) setTestimonials(JSON.parse(d.testimonials_config)) } catch {}
        setBusinessName(d.business_name ?? '')
        setWaNumber(d.wa_number ?? '')
        setWaMessage(d.wa_message ?? '')
        setContactEmail(d.contact_email ?? '')
        setBizHours(d.business_hours ?? '')
        setWhyCta(d.why_cta_title ?? '')
        setWhyCtaText(d.why_cta_text ?? '')
        setNosotrosImg(d.nosotros_hero_image ?? '')
        setLoading(false)
      })
  }, [])

  const doSave = useCallback(async (id: string, body: Record<string, string>) => {
    setSaves(s => ({ ...s, [id]: { saving: true, saved: false, error: '' } }))
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setSaves(s => ({ ...s, [id]: { saving: false, saved: true, error: '' } }))
      setTimeout(() => setSaves(s => ({ ...s, [id]: { ...s[id], saved: false } })), 3000)
    } catch {
      setSaves(s => ({ ...s, [id]: { saving: false, saved: false, error: 'Error al guardar' } }))
    }
  }, [])

  if (loading) return <div className="text-[13px] text-[#6B7280] dark:text-[#737373] py-10 text-center">Cargando configuración...</div>

  return (
    <div className="max-w-3xl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#111111] dark:text-white">Personalización</h1>
        <p className="text-[13px] text-[#6B7280] dark:text-[#737373] mt-0.5">
          Edita el contenido y las imágenes del sitio público.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-[#F4F4F5] dark:bg-[#1A1A1A] p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={[
              'flex-shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all',
              tab === t.id
                ? 'bg-white dark:bg-[#2A2A2A] text-[#111111] dark:text-white shadow-sm'
                : 'text-[#6B7280] dark:text-[#737373] hover:text-[#111111] dark:hover:text-white',
            ].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── HERO ─── */}
      {tab === 'hero' && (
        <div className="space-y-4">
          <Card title="Imagen de fondo">
            <Field label="Foto del hero" hint="La imagen ocupa todo el alto del hero. Recomendado: 1920×1080px o superior.">
              <ImageInput value={heroBg} onChange={setHeroBg} />
            </Field>
            <p className="text-[11px] text-[#9CA3AF] dark:text-[#525252]">
              Si no hay imagen, el hero usa la foto de portada del tour destacado.
            </p>
          </Card>

          <Card title="Texto del hero">
            <Field label="Título principal">
              <Input value={heroTitle} onChange={setHeroTitle} placeholder="Vive la República Dominicana" />
            </Field>
            <Field label="Subtítulo">
              <Textarea value={heroSub} onChange={setHeroSub} placeholder="Excursiones con guías locales certificados..." rows={2} />
            </Field>
          </Card>

          <Card title="Botón principal">
            <Field label="Texto del botón">
              <Input value={heroCta} onChange={setHeroCta} placeholder="Reservar ahora" />
            </Field>
            <Field label="URL de destino" hint="Puede ser una ruta interna (/excursiones) o una URL externa.">
              <Input value={heroCtaUrl} onChange={setHeroCtaUrl} placeholder="/excursiones" />
            </Field>
          </Card>

          <SaveRow id="hero" saves={saves} onSave={() => doSave('hero', { hero_title: heroTitle, hero_subtitle: heroSub, hero_cta: heroCta, hero_cta_url: heroCtaUrl, hero_bg_image: heroBg })} />
        </div>
      )}

      {/* ─── BANNERS ─── */}
      {tab === 'banners' && (
        <div className="space-y-4">
          {([0, 1] as const).map(i => (
            <Card key={i} title={`Banner ${i + 1} — ${i === 0 ? 'Descuento grupal (fondo oscuro, grande)' : 'Tour privado (fondo oscuro, compacto)'}`}>
              <Field label="Etiqueta superior">
                <Input value={banners[i].tag} onChange={v => setBanners(b => { const c = [...b] as [Banner, Banner]; c[i] = { ...c[i], tag: v }; return c })} placeholder="Descuento grupal" />
              </Field>
              <Field label="Título principal">
                <Input value={banners[i].title} onChange={v => setBanners(b => { const c = [...b] as [Banner, Banner]; c[i] = { ...c[i], title: v }; return c })} placeholder="VIAJAN 4 O MÁS" />
              </Field>
              {i === 0 && (
                <Field label="Línea de acento (en color naranja)" hint="Aparece debajo del título en color naranja.">
                  <Input value={banners[0].accent ?? ''} onChange={v => setBanners(b => { const c = [...b] as [Banner, Banner]; c[0] = { ...c[0], accent: v }; return c })} placeholder="20% DESCUENTO" />
                </Field>
              )}
              <Field label="Subtexto">
                <Textarea value={banners[i].sub} onChange={v => setBanners(b => { const c = [...b] as [Banner, Banner]; c[i] = { ...c[i], sub: v }; return c })} placeholder="Descripción corta..." rows={2} />
              </Field>
              <Field label="Texto del botón">
                <Input value={banners[i].btn_text} onChange={v => setBanners(b => { const c = [...b] as [Banner, Banner]; c[i] = { ...c[i], btn_text: v }; return c })} placeholder="Ver excursiones" />
              </Field>
              <Field label="URL del botón" hint={i === 1 ? 'Dejar vacío para usar el número de WhatsApp configurado.' : '/excursiones o URL externa'}>
                <Input value={banners[i].btn_url} onChange={v => setBanners(b => { const c = [...b] as [Banner, Banner]; c[i] = { ...c[i], btn_url: v }; return c })} placeholder={i === 0 ? '/excursiones' : 'vacío = WhatsApp'} />
              </Field>
            </Card>
          ))}
          <SaveRow id="banners" saves={saves} onSave={() => doSave('banners', { banners_config: JSON.stringify(banners) })} />
        </div>
      )}

      {/* ─── STATS ─── */}
      {tab === 'stats' && (
        <div className="space-y-4">
          <Card title="Franja de estadísticas">
            <p className="text-[12px] text-[#6B7280] dark:text-[#737373]">
              Aparece en la landing entre el grid de tours y los banners promocionales.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((s, i) => (
                <div key={i} className="bg-[#F7F7F7] dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-xl p-4 space-y-2">
                  <p className="text-[11px] font-bold text-[#9CA3AF] dark:text-[#525252] uppercase tracking-wider">Estadística {i + 1}</p>
                  <Field label="Número / Valor">
                    <Input value={s.n} onChange={v => setStats(st => { const c = [...st]; c[i] = { ...c[i], n: v }; return c })} placeholder="820+" />
                  </Field>
                  <Field label="Etiqueta">
                    <Input value={s.label} onChange={v => setStats(st => { const c = [...st]; c[i] = { ...c[i], label: v }; return c })} placeholder="viajeros satisfechos" />
                  </Field>
                </div>
              ))}
            </div>
          </Card>
          <SaveRow id="stats" saves={saves} onSave={() => doSave('stats', { stats_config: JSON.stringify(stats) })} />
        </div>
      )}

      {/* ─── ANNOUNCE BAR ─── */}
      {tab === 'announce' && (
        <div className="space-y-4">
          <Card title="Barra de anuncios">
            <p className="text-[12px] text-[#6B7280] dark:text-[#737373]">
              La franja negra en la parte superior de todas las páginas públicas. Muestra 3 beneficios clave.
            </p>
            {announce.map((item, i) => (
              <Field key={i} label={`Ítem ${i + 1}`}>
                <Input value={item} onChange={v => setAnnounce(a => { const c = [...a]; c[i] = v; return c })} placeholder="Beneficio clave..." />
              </Field>
            ))}
          </Card>
          <SaveRow id="announce" saves={saves} onSave={() => doSave('announce', { announce_config: JSON.stringify(announce) })} />
        </div>
      )}

      {/* ─── TESTIMONIALS ─── */}
      {tab === 'testimonials' && (
        <div className="space-y-4">
          {testimonials.map((t, i) => (
            <Card key={i} title={`Testimonio ${i + 1}`}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre">
                  <Input value={t.name} onChange={v => setTestimonials(ts => { const c = [...ts]; c[i] = { ...c[i], name: v }; return c })} placeholder="María y Javier" />
                </Field>
                <Field label="País / Origen">
                  <Input value={t.origin} onChange={v => setTestimonials(ts => { const c = [...ts]; c[i] = { ...c[i], origin: v }; return c })} placeholder="España" />
                </Field>
              </div>
              <Field label="Tour realizado">
                <Input value={t.tour} onChange={v => setTestimonials(ts => { const c = [...ts]; c[i] = { ...c[i], tour: v }; return c })} placeholder="Tour de Ballenas Jorobadas" />
              </Field>
              <Field label="Texto del testimonio">
                <Textarea value={t.text} onChange={v => setTestimonials(ts => { const c = [...ts]; c[i] = { ...c[i], text: v }; return c })} rows={3} placeholder="El momento más mágico..." />
              </Field>
            </Card>
          ))}
          <SaveRow id="testimonials" saves={saves} onSave={() => doSave('testimonials', { testimonials_config: JSON.stringify(testimonials) })} />
        </div>
      )}

      {/* ─── GENERAL ─── */}
      {tab === 'general' && (
        <div className="space-y-4">

          {/* Modo del panel */}
          <Card title="Modo del panel">
            <div className="grid grid-cols-2 gap-3">
              {(['light', 'dark'] as const).map(t => (
                <button key={t} onClick={() => setTheme(t)}
                  className={['flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all', theme === t ? 'border-[#1d70b7] bg-orange-50 dark:bg-[rgba(232,93,32,0.07)]' : 'border-[#E5E7EB] dark:border-[#262626] hover:border-[#D1D5DB]'].join(' ')}>
                  <div className={['w-8 h-8 rounded-lg flex items-center justify-center shrink-0', t === 'light' ? 'bg-[#F7F7F7]' : 'bg-[#1A1A1A]'].join(' ')}>
                    {t === 'light'
                      ? <svg className="w-4 h-4 text-[#1d70b7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>
                      : <svg className="w-4 h-4 text-[#1d70b7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#111111] dark:text-white">{t === 'light' ? 'Modo claro' : 'Modo oscuro'}</p>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#737373] mt-0.5">{t === 'light' ? 'Fondo blanco' : 'Fondo oscuro'}</p>
                  </div>
                  {theme === t && <svg className="w-4 h-4 text-[#1d70b7] ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#9CA3AF] dark:text-[#525252]">El modo se aplica solo a este panel de administración.</p>
          </Card>

          {/* Color de acento */}
          <Card title="Color de acento">
            <p className="text-[12px] text-[#6B7280] dark:text-[#737373]">Afecta botones, precios y badges en el sitio público.</p>
            <div className="flex flex-wrap gap-2">
              {[{ name:'Azul', hex:'#1d70b7' },{ name:'Coral', hex:'#FF385C' },{ name:'Azul Oscuro', hex:'#2563EB' },{ name:'Verde', hex:'#16A34A' },{ name:'Violeta', hex:'#7C3AED' },{ name:'Dorado', hex:'#D97706' }].map(p => (
                <button key={p.hex} onClick={() => { setAccent(p.hex); setCustomHex(p.hex); document.documentElement.style.setProperty('--color-accent', p.hex) }}
                  className={['flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border-2 transition-all', accent === p.hex ? 'border-transparent text-white scale-105' : 'border-[#E5E7EB] dark:border-[#2A2A2A] text-[#6B7280] dark:text-[#737373]'].join(' ')}
                  style={accent === p.hex ? { background: p.hex } : {}}>
                  <span className="w-3 h-3 rounded-full" style={{ background: p.hex }} />{p.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#F7F7F7] dark:bg-[#1A1A1A]">
                <input type="color" value={customHex} onChange={e => { setCustomHex(e.target.value); setAccent(e.target.value); document.documentElement.style.setProperty('--color-accent', e.target.value) }} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                <span className="text-[12px] font-mono text-[#6B7280] dark:text-[#737373]">{customHex}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A]">
                <span className="text-[13px] font-bold" style={{ color: accent }}>$75 USD</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: accent }}>TOP</span>
                <button className="text-[12px] font-bold px-3 py-1 rounded-lg text-white" style={{ background: accent }}>Reservar</button>
              </div>
            </div>
          </Card>

          <Card title="Negocio">
            <Field label="Nombre del negocio">
              <Input value={businessName} onChange={setBusinessName} placeholder="Dominicana Tour" />
            </Field>
            <Field label="Número de WhatsApp" hint="Solo números, con código de país. Ej: 18095550100">
              <Input value={waNumber} onChange={setWaNumber} placeholder="18095550100" />
            </Field>
            <Field label="Mensaje de WhatsApp por defecto">
              <Input value={waMessage} onChange={setWaMessage} placeholder="Hola! Me interesa una excursión." />
            </Field>
            <Field label="Email de contacto">
              <Input value={contactEmail} onChange={setContactEmail} placeholder="info@dominicanatour.com" />
            </Field>
            <Field label="Horario de atención">
              <Input value={bizHours} onChange={setBizHours} placeholder="Lun-Dom 8:00 AM - 8:00 PM" />
            </Field>
          </Card>

          <Card title="Sección CTA final">
            <Field label="Título">
              <Input value={whyCta} onChange={setWhyCta} placeholder="Tienes preguntas?" />
            </Field>
            <Field label="Subtexto">
              <Textarea value={whyCtaText} onChange={setWhyCtaText} rows={2} placeholder="Nuestros expertos diseñan la excursión perfecta..." />
            </Field>
          </Card>

          <Card title="Página Nosotros">
            <Field label="Imagen de fondo hero" hint="La foto de cabecera en /nosotros">
              <ImageInput value={nosotrosImg} onChange={setNosotrosImg} />
            </Field>
          </Card>

          <SaveRow id="general" saves={saves} onSave={() => doSave('general', {
            accent_color: accent,
            business_name: businessName, wa_number: waNumber, wa_message: waMessage,
            contact_email: contactEmail, business_hours: bizHours,
            why_cta_title: whyCta, why_cta_text: whyCtaText,
            nosotros_hero_image: nosotrosImg,
          })} />
        </div>
      )}
    </div>
  )
}
