'use client'
import { useState, useEffect, useCallback } from 'react'

type Contact = {
  email: string; phone: string; firstName: string; lastName: string
  country: string; hotelZone: string; language: string
  bookings: number; totalSpent: number; lastTour: string; lastDate: string
}
type Campaign = {
  id: number; name: string; type: string; subject: string | null
  status: string; recipientCount: number; sentAt: string | null; createdAt: string
  body: string
}
type Subscriber = {
  id: number; name: string | null; email: string; subscribed: boolean; createdAt: string
}
type WaContact = { phone: string; name: string; message: string }

const TAB_ITEMS = ['Contactos', 'Campañas', 'Suscriptores'] as const
type Tab = typeof TAB_ITEMS[number]

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Badge({ children, color }: { children: React.ReactNode; color: 'green' | 'amber' | 'blue' | 'gray' }) {
  const cls = { green: 'bg-emerald-500/15 text-emerald-400', amber: 'bg-amber-500/15 text-amber-400', blue: 'bg-blue-500/15 text-blue-400', gray: 'bg-dt-bg-2 text-dt-text-3' }[color]
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>{children}</span>
}

// ─── WA Phone List Modal ──────────────────────────────────────────────────
function WaListModal({ contacts, campaignName, onClose }: { contacts: WaContact[]; campaignName: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  function copyAll() {
    const text = contacts.map(c => `${c.phone} — ${c.name}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-dt-surface rounded-2xl border border-dt-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-dt-border shrink-0">
          <div>
            <h3 className="font-semibold text-dt-text text-[15px]">Lista WhatsApp — {campaignName}</h3>
            <p className="text-[12px] text-dt-text-3 mt-0.5">{contacts.length} número{contacts.length !== 1 ? 's' : ''} generados</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-dt-text-3 hover:text-dt-text hover:bg-dt-bg-2 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {contacts.map((c, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-dt-bg-2 rounded-lg border border-dt-border">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-dt-text">{c.name}</p>
                <p className="text-[12px] text-dt-text-3 font-mono">{c.phone}</p>
              </div>
              <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}?text=${encodeURIComponent(c.message)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/20 transition-colors shrink-0">
                <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Enviar
              </a>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-dt-border shrink-0 flex gap-2">
          <button onClick={copyAll}
            className="flex items-center gap-2 px-4 py-2 border border-dt-border text-dt-text-2 rounded-lg text-[13px] font-medium hover:bg-dt-bg-2 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
            {copied ? 'Copiado!' : 'Copiar lista'}
          </button>
          <button onClick={onClose} className="ml-auto px-4 py-2 bg-accent text-white rounded-lg text-[13px] font-semibold hover:opacity-90 transition-opacity">
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Campaign Modal ──────────────────────────────────────────────────────────
function CampaignModal({
  onClose, onSaved,
}: { onClose: () => void; onSaved: (phoneList?: WaContact[], name?: string) => void }) {
  const [form, setForm] = useState({ name: '', type: 'EMAIL', subject: '', body: '', filterCountry: '', filterZone: '' })
  const [preview, setPreview] = useState<number | null>(null)
  const [saving,  setSaving]  = useState(false)

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  const fetchPreview = useCallback(async () => {
    const params = new URLSearchParams()
    if (form.filterCountry) params.set('country', form.filterCountry)
    if (form.filterZone)    params.set('zone', form.filterZone)
    params.set('count', '1')
    const r = await fetch(`/api/admin/marketing/contactos?${params}`)
    const d = await r.json()
    setPreview(d.total ?? 0)
  }, [form.filterCountry, form.filterZone])

  useEffect(() => { fetchPreview() }, [fetchPreview])

  async function handleSave(sendNow = false) {
    if (!form.name || !form.body) return
    if (form.type === 'EMAIL' && !form.subject) return
    setSaving(true)
    const res = await fetch('/api/admin/marketing/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, sendNow }),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      onSaved(data.phoneList, form.name)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-dt-surface rounded-2xl border border-dt-border w-full max-w-xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-dt-border">
          <h3 className="font-semibold text-dt-text text-[15px]">Nueva campaña</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-dt-text-3 hover:text-dt-text hover:bg-dt-bg-2 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-dt-text-3 uppercase tracking-wide mb-1">Nombre interno *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="ej. Promo Julio 2026"
              className="w-full px-3 py-2 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-[13px] focus:outline-none focus:border-accent placeholder:text-dt-text-3" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-dt-text-3 uppercase tracking-wide mb-1">Tipo *</label>
            <div className="flex gap-2">
              {['EMAIL', 'WHATSAPP'].map(t => (
                <button key={t} onClick={() => set('type', t)}
                  className={`px-4 py-2 rounded-lg border text-[13px] font-semibold transition-colors ${form.type === t ? 'bg-accent text-white border-accent' : 'border-dt-border text-dt-text-2 hover:bg-dt-bg-2'}`}>
                  {t === 'EMAIL' ? '📧 Email' : '💬 WhatsApp'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-dt-bg-2 rounded-xl border border-dt-border">
            <p className="text-[11px] font-bold text-dt-text-3 uppercase tracking-wide mb-2">Filtrar destinatarios</p>
            <div className="grid grid-cols-2 gap-2">
              <input value={form.filterCountry} onChange={e => set('filterCountry', e.target.value)}
                placeholder="País (ej. Estados Unidos)"
                className="px-3 py-1.5 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-[12px] focus:outline-none focus:border-accent placeholder:text-dt-text-3" />
              <input value={form.filterZone} onChange={e => set('filterZone', e.target.value)}
                placeholder="Zona hotel (ej. Punta Cana)"
                className="px-3 py-1.5 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-[12px] focus:outline-none focus:border-accent placeholder:text-dt-text-3" />
            </div>
            <p className="text-[12px] mt-2 font-semibold">
              {preview === null ? 'Calculando...' : <><span className="text-accent">{preview}</span> contacto{preview !== 1 ? 's' : ''} recibirán esta campaña</>}
            </p>
          </div>

          {form.type === 'EMAIL' && (
            <div>
              <label className="block text-[11px] font-bold text-dt-text-3 uppercase tracking-wide mb-1">Asunto *</label>
              <input value={form.subject} onChange={e => set('subject', e.target.value)}
                placeholder="ej. ¡Oferta exclusiva para ti! 🌴"
                className="w-full px-3 py-2 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-[13px] focus:outline-none focus:border-accent placeholder:text-dt-text-3" />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-dt-text-3 uppercase tracking-wide mb-1">
              {form.type === 'EMAIL' ? 'Cuerpo (HTML o texto)' : 'Mensaje WhatsApp'} *
            </label>
            <textarea rows={5} value={form.body} onChange={e => set('body', e.target.value)}
              placeholder={form.type === 'EMAIL'
                ? '<p>Hola {nombre},</p><p>Tenemos una oferta especial para ti...</p>'
                : 'Hola {nombre}, tenemos una oferta especial. 🌴\n\nVer más: https://dominicanatour.com'}
              className="w-full px-3 py-2 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-[13px] focus:outline-none focus:border-accent resize-none placeholder:text-dt-text-3 font-mono text-xs" />
            <p className="text-[11px] text-dt-text-3 mt-1">Usa <code className="bg-dt-bg-2 px-1 rounded">{'{nombre}'}</code> para personalizar</p>
          </div>

          {form.type === 'WHATSAPP' && (
            <div className="p-3 bg-blue-500/8 border border-blue-500/20 rounded-xl">
              <p className="text-[12px] text-blue-400 font-medium">Al enviar, recibirás una lista de números con links directos a WhatsApp Web para enviar mensaje a cada contacto.</p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-dt-border flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-dt-border text-dt-text-2 rounded-lg text-[13px] font-medium hover:bg-dt-bg-2 transition-colors">Cancelar</button>
          <button onClick={() => handleSave(false)} disabled={saving}
            className="px-4 py-2 border border-dt-border text-dt-text-2 rounded-lg text-[13px] font-medium hover:bg-dt-bg-2 disabled:opacity-50 transition-colors">
            Guardar borrador
          </button>
          <button onClick={() => handleSave(true)} disabled={saving || (preview ?? 0) === 0}
            className="px-4 py-2 bg-accent text-white rounded-lg text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition-colors">
            {saving ? 'Enviando...' : `Enviar a ${preview ?? '?'} contactos`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function MarketingClient() {
  const [tab,         setTab]         = useState<Tab>('Contactos')
  const [contacts,    setContacts]    = useState<Contact[]>([])
  const [campaigns,   setCampaigns]   = useState<Campaign[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [showModal,   setShowModal]   = useState(false)
  const [exporting,   setExporting]   = useState(false)
  const [waList,      setWaList]      = useState<{ contacts: WaContact[]; name: string } | null>(null)

  const load = useCallback(async (t: Tab) => {
    setLoading(true)
    try {
      if (t === 'Contactos') {
        const r = await fetch('/api/admin/marketing/contactos')
        const d = await r.json()
        setContacts(d.contacts ?? [])
      } else if (t === 'Campañas') {
        const r = await fetch('/api/admin/marketing/campaigns')
        const d = await r.json()
        setCampaigns(d.campaigns ?? [])
      } else {
        const r = await fetch('/api/admin/marketing/suscriptores')
        const d = await r.json()
        setSubscribers(d.subscribers ?? [])
      }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  async function exportCSV() {
    setExporting(true)
    const r = await fetch('/api/admin/marketing/contactos?format=csv')
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'contactos.csv'; a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  async function toggleSubscriber(id: number, sub: boolean) {
    await fetch(`/api/admin/marketing/suscriptores/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscribed: sub }),
    })
    setSubscribers(ss => ss.map(s => s.id === id ? { ...s, subscribed: sub } : s))
  }

  function onCampaignSaved(phoneList?: WaContact[], name?: string) {
    load('Campañas')
    if (phoneList && phoneList.length > 0 && name) {
      setWaList({ contacts: phoneList, name })
    }
  }

  const filteredContacts = search
    ? contacts.filter(c => `${c.firstName} ${c.lastName} ${c.email} ${c.phone} ${c.country} ${c.hotelZone}`.toLowerCase().includes(search.toLowerCase()))
    : contacts

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-dt-text">Marketing</h1>
          <p className="text-dt-text-3 text-sm mt-0.5">Gestión de contactos y campañas</p>
        </div>
        {tab === 'Campañas' && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Nueva campaña
          </button>
        )}
        {tab === 'Contactos' && (
          <button onClick={exportCSV} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-dt-bg-2 border border-dt-border text-dt-text-2 rounded-xl text-[13px] font-semibold hover:bg-dt-surface disabled:opacity-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-dt-bg-2 border border-dt-border rounded-xl p-1 w-fit">
        {TAB_ITEMS.map(t => (
          <button key={t} onClick={() => { setTab(t); setSearch('') }}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${tab === t ? 'bg-accent text-white' : 'text-dt-text-3 hover:text-dt-text hover:bg-dt-surface'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Stats row */}
      {!loading && tab === 'Contactos' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total contactos',  value: contacts.length },
            { label: 'Países distintos', value: new Set(contacts.map(c => c.country).filter(Boolean)).size },
            { label: 'Zonas hoteleras',  value: new Set(contacts.map(c => c.hotelZone).filter(Boolean)).size },
            { label: 'Reservas totales', value: contacts.reduce((s, c) => s + c.bookings, 0) },
          ].map(s => (
            <div key={s.label} className="bg-dt-surface rounded-xl border border-dt-border px-4 py-3">
              <p className="text-dt-text-3 text-[11px] uppercase tracking-wide font-medium">{s.label}</p>
              <p className="text-dt-text text-2xl font-bold tabular-nums mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-dt-text-3 text-sm">Cargando...</div>
      ) : (
        <>
          {/* CONTACTOS */}
          {tab === 'Contactos' && (
            <div>
              <div className="mb-3 relative w-full sm:w-72">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dt-text-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input type="text" placeholder="Buscar contacto..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-dt-border rounded-lg bg-dt-bg text-dt-text text-[13px] focus:outline-none focus:border-accent w-full placeholder:text-dt-text-3" />
              </div>
              <div className="bg-dt-surface rounded-xl border border-dt-border overflow-hidden">
                {filteredContacts.length === 0 ? (
                  <div className="p-12 text-center text-dt-text-3 text-sm">
                    {search ? 'Sin resultados' : 'Los contactos se generan automáticamente desde las reservas.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-dt-border bg-dt-bg-2 text-dt-text-3 text-left text-[11px] uppercase tracking-wide">
                          <th className="px-4 py-3 font-medium">Cliente</th>
                          <th className="px-4 py-3 font-medium">Contacto</th>
                          <th className="px-4 py-3 font-medium hidden md:table-cell">País · Zona</th>
                          <th className="px-4 py-3 font-medium text-center">Reservas</th>
                          <th className="px-4 py-3 font-medium">Última excursión</th>
                          <th className="px-4 py-3 font-medium hidden lg:table-cell">Gasto total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dt-border">
                        {filteredContacts.map((c, i) => (
                          <tr key={i} className="hover:bg-dt-bg-2 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-dt-text text-[13px]">{c.firstName} {c.lastName}</div>
                              {c.language && <div className="text-[11px] text-dt-text-3">{c.language}</div>}
                            </td>
                            <td className="px-4 py-3">
                              {c.phone && (
                                <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[12px] text-emerald-400 hover:underline mb-0.5">
                                  <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                  {c.phone}
                                </a>
                              )}
                              {c.email && <div className="text-[11px] text-dt-text-3 truncate max-w-[140px]">{c.email}</div>}
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <div className="text-[12px] text-dt-text-2">{c.country || '—'}</div>
                              <div className="text-[11px] text-dt-text-3">{c.hotelZone || '—'}</div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-bold text-[14px] ${c.bookings > 1 ? 'text-accent' : 'text-dt-text'}`}>{c.bookings}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-[12px] text-dt-text-2 leading-snug">{c.lastTour || '—'}</div>
                              {c.lastDate && <div className="text-[11px] text-dt-text-3">{fmtDate(c.lastDate)}</div>}
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <span className="font-semibold text-[13px] tabular-nums">${c.totalSpent.toLocaleString('es-DO', { minimumFractionDigits: 0 })}</span>
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

          {/* CAMPAÑAS */}
          {tab === 'Campañas' && (
            <div>
              {campaigns.length === 0 ? (
                <div className="bg-dt-surface rounded-xl border border-dt-border p-12 text-center">
                  <div className="w-10 h-10 rounded-xl bg-dt-bg-2 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-dt-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </div>
                  <p className="text-dt-text-3 text-sm mb-4">No hay campañas todavía</p>
                  <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold">
                    Crear primera campaña
                  </button>
                </div>
              ) : (
                <div className="bg-dt-surface rounded-xl border border-dt-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-dt-border bg-dt-bg-2 text-dt-text-3 text-left text-[11px] uppercase tracking-wide">
                          <th className="px-4 py-3 font-medium">Campaña</th>
                          <th className="px-4 py-3 font-medium">Tipo</th>
                          <th className="px-4 py-3 font-medium">Destinatarios</th>
                          <th className="px-4 py-3 font-medium">Estado</th>
                          <th className="px-4 py-3 font-medium">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dt-border">
                        {campaigns.map(c => (
                          <tr key={c.id} className="hover:bg-dt-bg-2 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-dt-text text-[13px]">{c.name}</div>
                              {c.subject && <div className="text-[11px] text-dt-text-3 truncate max-w-xs">{c.subject}</div>}
                            </td>
                            <td className="px-4 py-3">
                              <Badge color={c.type === 'EMAIL' ? 'blue' : 'green'}>
                                {c.type === 'EMAIL' ? '📧 Email' : '💬 WA'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-bold tabular-nums text-dt-text">{c.recipientCount}</td>
                            <td className="px-4 py-3">
                              <Badge color={c.status === 'SENT' ? 'green' : 'amber'}>
                                {c.status === 'SENT' ? 'Enviada' : 'Borrador'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-dt-text-2 text-[12px]">
                              {c.sentAt ? fmtDate(c.sentAt) : fmtDate(c.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUSCRIPTORES */}
          {tab === 'Suscriptores' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[13px] text-dt-text-2">
                  <span className="font-bold text-dt-text">{subscribers.filter(s => s.subscribed).length}</span> activos de {subscribers.length} registrados
                </span>
              </div>
              <div className="bg-dt-surface rounded-xl border border-dt-border overflow-hidden">
                {subscribers.length === 0 ? (
                  <div className="p-12 text-center text-dt-text-3 text-sm">No hay suscriptores aún</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-dt-border bg-dt-bg-2 text-dt-text-3 text-left text-[11px] uppercase tracking-wide">
                          <th className="px-4 py-3 font-medium">Nombre</th>
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-4 py-3 font-medium">Registro</th>
                          <th className="px-4 py-3 font-medium">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dt-border">
                        {subscribers.map(s => (
                          <tr key={s.id} className="hover:bg-dt-bg-2 transition-colors">
                            <td className="px-4 py-3 font-medium text-dt-text text-[13px]">{s.name || '—'}</td>
                            <td className="px-4 py-3 text-dt-text-2 text-[12px]">{s.email}</td>
                            <td className="px-4 py-3 text-dt-text-3 text-[12px]">{fmtDate(s.createdAt)}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => toggleSubscriber(s.id, !s.subscribed)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${s.subscribed ? 'bg-emerald-500/15 text-emerald-400 hover:bg-red-500/15 hover:text-red-400' : 'bg-red-500/15 text-red-400 hover:bg-emerald-500/15 hover:text-emerald-400'}`}>
                                {s.subscribed ? 'Activo' : 'Inactivo'}
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
        </>
      )}

      {showModal && (
        <CampaignModal onClose={() => setShowModal(false)} onSaved={onCampaignSaved} />
      )}

      {waList && (
        <WaListModal contacts={waList.contacts} campaignName={waList.name} onClose={() => setWaList(null)} />
      )}
    </div>
  )
}
