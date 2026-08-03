'use client'
import { useState, useTransition, useRef, useEffect } from 'react'

/* ??? Types ??? */
type ConfigSection = { key: string; label: string; type: 'text' | 'textarea' | 'number'; hint?: string }
type User = { id: number; name: string; email: string; role: string; active: boolean; permissions: string | null; createdAt: string }

const MODULES = [
  { key: 'tours',         label: 'Tours',        icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { key: 'reservas',      label: 'Reservas',     icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'reportes',      label: 'Reportes',     icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { key: 'ofertas',       label: 'Ofertas',      icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
  { key: 'cupones',       label: 'Cupones',      icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
  { key: 'soporte',       label: 'Soporte',      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { key: 'proveedores',   label: 'Proveedores',  icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { key: 'configuracion', label: 'Configuraci?n',icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

const ROLES = ['ADMIN', 'AGENT', 'GUIDE']

const CONFIG_SECTIONS: { title: string; icon: string; fields: ConfigSection[] }[] = [
  {
    title: 'General',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    fields: [
      { key: 'business_name',  label: 'Nombre del negocio', type: 'text' },
      { key: 'wa_number',      label: 'WhatsApp (solo d?gitos)', type: 'text', hint: 'Ej: 18095550100' },
      { key: 'wa_message',     label: 'Mensaje inicial WhatsApp', type: 'text' },
      { key: 'contact_email',  label: 'Email de contacto', type: 'text' },
      { key: 'business_hours', label: 'Horario de atenci?n', type: 'text' },
      { key: 'deposit_pct',    label: 'Porcentaje de anticipo (%)', type: 'number', hint: 'Ej: 30' },
    ],
  },
  {
    title: 'Hero',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    fields: [
      { key: 'hero_title',    label: 'T?tulo del hero', type: 'text' },
      { key: 'hero_subtitle', label: 'Subt?tulo del hero', type: 'textarea' },
      { key: 'hero_cta',      label: 'Texto del bot?n principal', type: 'text' },
    ],
  },
  {
    title: 'CTA Final',
    icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
    fields: [
      { key: 'featured_title', label: 'T?tulo "Lo m?s reservado"', type: 'text' },
      { key: 'why_cta_title',  label: 'T?tulo del CTA final', type: 'text' },
      { key: 'why_cta_text',   label: 'Texto del CTA final', type: 'textarea' },
    ],
  },
]

function Ico({ d, cls }: { d: string; cls?: string }) {
  return (
    <svg className={['w-3.5 h-3.5 shrink-0', cls].filter(Boolean).join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const iCls = "w-full px-3 py-2 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-sm focus:outline-none focus:border-accent placeholder:text-dt-text-3 transition-colors"
const lCls = "block text-xs font-semibold text-dt-text-2 mb-1.5"

/* ??? Site config tab ??? */
function SiteConfigTab({ initial }: { initial: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')
  const [isPending, startTransition] = useTransition()
  const [activeSection, setActiveSection] = useState(0)

  function handleSave() {
    startTransition(async () => {
      setError('')
      const res = await fetch('/api/admin/config', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (!res.ok) { setError('Error al guardar'); return }
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    })
  }

  const section = CONFIG_SECTIONS[activeSection]
  return (
    <div className="flex gap-0">
      <div className="w-40 shrink-0 border-r border-dt-border pr-0 pt-1 pb-4 space-y-0.5">
        {CONFIG_SECTIONS.map((s, i) => (
          <button key={s.title} onClick={() => setActiveSection(i)}
            className={['w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-left transition-colors', i === activeSection ? 'bg-accent/10 text-accent font-semibold' : 'text-dt-text-3 hover:bg-dt-bg-2 hover:text-dt-text'].join(' ')}>
            <Ico d={s.icon} /><span className="leading-tight">{s.title}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 pl-6">
        <h2 className="text-[13px] font-bold text-dt-text mb-4">{section.title}</h2>
        <div className="space-y-4 mb-5">
          {section.fields.map(f => (
            <div key={f.key}>
              <label className={lCls}>{f.label}</label>
              {f.type === 'textarea'
                ? <textarea rows={3} value={values[f.key] ?? ''} onChange={e => { setValues(p => ({ ...p, [f.key]: e.target.value })); setSaved(false) }} className={iCls + ' resize-none'} />
                : <input type={f.type === 'number' ? 'number' : 'text'} value={values[f.key] ?? ''} onChange={e => { setValues(p => ({ ...p, [f.key]: e.target.value })); setSaved(false) }} className={iCls} />
              }
              {f.hint && <p className="text-[11px] text-dt-text-3 mt-1">{f.hint}</p>}
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={isPending}
            className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors">
            {isPending ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</> : 'Guardar cambios'}
          </button>
          {saved && <span className="text-sm text-emerald-400 font-medium">Guardado</span>}
        </div>
      </div>
    </div>
  )
}

/* ??? User form ??? */
function UserModal({ user, onClose, onSave }: {
  user: Partial<User> | null; onClose: () => void; onSave: (u: User) => void
}) {
  const isEdit = !!user?.id
  const [form, setForm] = useState({
    name: user?.name ?? '', email: user?.email ?? '', password: '',
    role: user?.role ?? 'AGENT', active: user?.active ?? true,
  })
  const [permissions, setPermissions] = useState<string[]>(() => {
    if (!user?.permissions) return []
    try { return JSON.parse(user.permissions) } catch { return [] }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const s = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))
  const isAdmin = form.role === 'ADMIN'

  function toggleModule(key: string) {
    setPermissions(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isEdit && !form.password.trim()) { setError('La contrase?a es requerida.'); return }
    setSaving(true); setError('')
    const body = { ...form, permissions: isAdmin ? null : permissions, password: form.password || undefined }
    const res = await fetch(isEdit ? `/api/admin/usuarios/${user!.id}` : '/api/admin/usuarios', {
      method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Error'); setSaving(false); return }
    onSave(data.user); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-dt-surface border border-dt-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-dt-border sticky top-0 bg-dt-surface z-10">
          <h2 className="text-[15px] font-semibold text-dt-text">{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-dt-text-3 hover:text-dt-text hover:bg-dt-bg-2 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lCls}>Nombre completo *</label>
              <input value={form.name} onChange={e => s('name', e.target.value)} required className={iCls} placeholder="Juan Garc?a" />
            </div>
            <div>
              <label className={lCls}>Rol</label>
              <select value={form.role} onChange={e => s('role', e.target.value)} className={iCls}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lCls}>Email *</label>
            <input type="email" value={form.email} onChange={e => s('email', e.target.value)} required className={iCls} placeholder="usuario@email.com" />
          </div>

          <div>
            <label className={lCls}>{isEdit ? 'Nueva contrase?a (dejar vac?o para no cambiar)' : 'Contrase?a *'}</label>
            <input type="password" value={form.password} onChange={e => s('password', e.target.value)} className={iCls} placeholder={isEdit ? 'Dejar vac?o para no cambiar' : 'M?nimo 6 caracteres'} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.active} onChange={e => s('active', e.target.checked)} className="w-4 h-4 accent-accent rounded" />
            <span className="text-sm text-dt-text-2">Usuario activo</span>
          </label>

          {/* Permissions ? only for non-ADMIN */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={lCls + ' mb-0'}>Acceso a m?dulos</label>
              {isAdmin && <span className="text-[11px] text-emerald-400 font-semibold">ADMIN ? acceso total</span>}
            </div>
            {!isAdmin && (
              <div className="grid grid-cols-2 gap-2 border border-dt-border rounded-xl p-3 bg-dt-bg-2">
                {MODULES.map(m => (
                  <label key={m.key} className="flex items-center gap-2 cursor-pointer select-none py-1">
                    <input type="checkbox" checked={permissions.includes(m.key)} onChange={() => toggleModule(m.key)} className="w-3.5 h-3.5 accent-accent rounded" />
                    <Ico d={m.icon} cls="text-dt-text-3" />
                    <span className="text-[13px] text-dt-text-2">{m.label}</span>
                  </label>
                ))}
              </div>
            )}
            {isAdmin && (
              <div className="border border-dt-border rounded-xl p-3 bg-dt-bg-2">
                <div className="grid grid-cols-4 gap-2">
                  {MODULES.map(m => (
                    <div key={m.key} className="flex items-center gap-1.5 opacity-50">
                      <Ico d={m.icon} cls="text-emerald-400" />
                      <span className="text-[11px] text-dt-text-3">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-accent text-white font-semibold text-sm rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors">
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
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

/* ??? Usuarios tab ??? */
function UsuariosTab({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [modal, setModal] = useState<Partial<User> | null | false>(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  function handleSave(u: User) {
    setUsers(prev => prev.find(x => x.id === u.id) ? prev.map(x => x.id === u.id ? u : x) : [u, ...prev])
  }

  async function del(id: number) {
    if (!confirm('?Eliminar este usuario? Esta acci?n no se puede deshacer.')) return
    setDeleting(id)
    const res = await fetch(`/api/admin/usuarios/${id}`, { method: 'DELETE' })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== id))
    else { const d = await res.json(); alert(d.error ?? 'Error') }
    setDeleting(null)
  }

  const roleColor: Record<string, string> = {
    ADMIN: 'bg-violet-500/10 text-violet-400',
    AGENT: 'bg-blue-500/10 text-blue-400',
    GUIDE: 'bg-amber-500/10 text-amber-400',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-dt-text-3">Administradores y agentes con acceso al panel.</p>
        <button onClick={() => setModal({})}
          className="flex items-center gap-2 bg-accent text-white text-[12px] font-semibold px-3 py-2 rounded-lg hover:bg-accent/90 transition-colors">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Nuevo usuario
        </button>
      </div>

      <div className="border border-dt-border rounded-xl overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center text-dt-text-3 text-sm">Sin usuarios registrados.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dt-border bg-dt-bg-2 text-[10px] uppercase tracking-wide text-dt-text-3 text-left">
                <th className="px-4 py-2.5 font-medium">Usuario</th>
                <th className="px-4 py-2.5 font-medium">Rol</th>
                <th className="px-4 py-2.5 font-medium hidden sm:table-cell">M?dulos</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dt-border">
              {users.map(u => {
                const perms: string[] = u.role === 'ADMIN' ? MODULES.map(m => m.key) : (() => { try { return JSON.parse(u.permissions ?? '[]') } catch { return [] } })()
                return (
                  <tr key={u.id} className="hover:bg-dt-bg-2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-accent text-[11px] font-extrabold shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-dt-text">{u.name}</p>
                          <p className="text-[11px] text-dt-text-3">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={['text-[11px] font-bold px-2 py-0.5 rounded-full', roleColor[u.role] ?? 'bg-dt-bg-2 text-dt-text-3'].join(' ')}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {u.role === 'ADMIN' ? (
                        <span className="text-[11px] text-emerald-400 font-semibold">Acceso total</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {perms.length === 0 ? (
                            <span className="text-[11px] text-dt-text-3">Sin acceso</span>
                          ) : perms.slice(0, 4).map(p => (
                            <span key={p} className="text-[10px] font-semibold bg-dt-bg-2 border border-dt-border px-1.5 py-0.5 rounded-md text-dt-text-2">
                              {MODULES.find(m => m.key === p)?.label ?? p}
                            </span>
                          ))}
                          {perms.length > 4 && <span className="text-[10px] text-dt-text-3">+{perms.length - 4}</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={['text-[11px] font-bold px-2 py-0.5 rounded-full', u.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-dt-bg-2 text-dt-text-3'].join(' ')}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => setModal(u)}
                          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-dt-border text-dt-text-2 hover:border-accent hover:text-accent transition-colors">
                          Editar
                        </button>
                        <button onClick={() => del(u.id)} disabled={deleting === u.id}
                          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-dt-border text-dt-text-2 hover:border-red-400 hover:text-red-400 disabled:opacity-50 transition-colors">
                          {deleting === u.id ? '...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal !== false && (
        <UserModal user={modal} onClose={() => setModal(false)} onSave={handleSave} />
      )}
    </div>
  )
}

/* ??? XLS tab ??? */
function XlsTab() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(null)

  const CSV_COLS = ['name','subtitle','description','category','priceAdult','priceChild','costPrice','duration','difficulty','maxPeople','minAge','departureZone','departureTime','languages','active','featured']
  const EXAMPLE_ROW = ['27 Charcos de Damajagua','La aventura m?s famosa de RD','Descripci?n...','Naturaleza','79','39','35','8 horas','EASY','20','5','Punta Cana','8:00 AM','Espa?ol, Ingl?s','true','false']

  function downloadTemplate() {
    const blob = new Blob([[CSV_COLS.join(','), EXAMPLE_ROW.map(v => v.includes(',') ? `"${v}"` : v).join(',')].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'plantilla-tours.csv' })
    a.click(); URL.revokeObjectURL(a.href)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setImporting(true); setImportResult(null)
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch('/api/admin/tours/import', { method: 'POST', body: fd })
      const data = await res.json()
      setImportResult({ created: data.created ?? 0, errors: data.errors ?? [] })
    } catch { setImportResult({ created: 0, errors: ['Error al procesar el archivo.'] }) }
    finally { setImporting(false); if (fileRef.current) fileRef.current.value = '' }
  }

  return (
    <div className="space-y-6">
      <div className="border border-dt-border rounded-xl p-5">
        <h3 className="text-[13px] font-semibold text-dt-text mb-1">Exportar todos los tours</h3>
        <p className="text-[12px] text-dt-text-3 mb-4">Descarga todos los tours en CSV. Compatible con Excel, Google Sheets.</p>
        <a href="/api/admin/tours/export" download="tours.csv"
          className="inline-flex items-center gap-2 px-4 py-2 bg-dt-bg-2 border border-dt-border text-dt-text text-[13px] font-semibold rounded-lg hover:border-accent hover:text-accent transition-colors">
          <Ico d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          Descargar tours.csv
        </a>
      </div>
      <div className="border border-dt-border rounded-xl p-5">
        <h3 className="text-[13px] font-semibold text-dt-text mb-1">Plantilla de importaci?n</h3>
        <div className="bg-dt-bg-2 rounded-lg p-2.5 mb-4 overflow-x-auto">
          <p className="text-[10px] font-mono text-dt-text-3 whitespace-nowrap">{CSV_COLS.join(' ? ')}</p>
        </div>
        <button onClick={downloadTemplate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-dt-bg-2 border border-dt-border text-dt-text text-[13px] font-semibold rounded-lg hover:border-accent hover:text-accent transition-colors">
          <Ico d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          Descargar plantilla
        </button>
      </div>
      <div className="border border-dt-border rounded-xl p-5">
        <h3 className="text-[13px] font-semibold text-dt-text mb-1">Importar desde CSV</h3>
        <p className="text-[12px] text-dt-text-3 mb-4">Los tours con el mismo nombre no se duplican.</p>
        <label className={['flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors', importing ? 'border-accent/40 bg-accent/5' : 'border-dt-border hover:border-accent/40 hover:bg-accent/5'].join(' ')}>
          <Ico d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" cls="w-5 h-5 text-dt-text-3" />
          <div>
            <p className="text-[13px] font-semibold text-dt-text">{importing ? 'Procesando...' : 'Selecciona archivo CSV'}</p>
            <p className="text-[11px] text-dt-text-3">Formato: .csv</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" className="sr-only" onChange={handleImport} disabled={importing} />
        </label>
        {importResult && (
          <div className={['mt-4 px-4 py-3 rounded-xl border text-[13px]', importResult.errors.length > 0 ? 'border-amber-500/20 bg-amber-500/5' : 'border-emerald-500/20 bg-emerald-500/5'].join(' ')}>
            <p className={['font-semibold mb-1', importResult.errors.length > 0 ? 'text-amber-400' : 'text-emerald-400'].join(' ')}>
              {importResult.created} tour{importResult.created !== 1 ? 's' : ''} importado{importResult.created !== 1 ? 's' : ''}
            </p>
            {importResult.errors.slice(0, 5).map((err, i) => <p key={i} className="text-amber-400 text-[12px]">{err}</p>)}
          </div>
        )}
      </div>
    </div>
  )
}

/* ??? Main ??? */
const TOP_TABS = [
  { key: 'config',   label: 'Sitio',     icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { key: 'usuarios', label: 'Usuarios',  icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { key: 'xls',      label: 'Importar / Exportar', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]

export default function ConfigEditor({ initial, users }: { initial: Record<string, string>; users: User[] }) {
  const [tab, setTab] = useState<'config' | 'usuarios' | 'xls'>('config')
  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-dt-border">
        {TOP_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={['flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors', tab === t.key ? 'border-accent text-accent' : 'border-transparent text-dt-text-3 hover:text-dt-text'].join(' ')}>
            <Ico d={t.icon} />{t.label}
          </button>
        ))}
      </div>
      <div className="pt-1">
        {tab === 'config'   && <SiteConfigTab initial={initial} />}
        {tab === 'usuarios' && <UsuariosTab initialUsers={users} />}
        {tab === 'xls'      && <XlsTab />}
      </div>
    </div>
  )
}

