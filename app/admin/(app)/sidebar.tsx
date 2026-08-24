"use client"
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

function Ico({ d }: { d: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const ICONS = {
  dashboard:    'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  reservas:     'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  alojamientos: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  tours:        'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  soporte:      'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  personalizar: 'M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z',
  settings:     'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  ofertas:      'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
  cupones:      'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
  logout:       'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  map:          'M12 2C8 2 5 5 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-4-3-7-7-7z M12 11a2 2 0 100-4 2 2 0 000 4z',
  resenas:      'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  marketing:    'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  reportes:     'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
}

const SECTIONS: {
  label?: string
  items: { href: string; label: string; icon: string; exact?: boolean }[]
}[] = [
  {
    items: [
      { href: '/admin', label: 'Dashboard', icon: ICONS.dashboard, exact: true },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { href: '/admin/tours',        label: 'Excursiones',   icon: ICONS.tours        },
      { href: '/admin/alojamientos', label: 'Alojamientos', icon: ICONS.alojamientos },
      { href: '/admin/ofertas', label: 'Ofertas', icon: ICONS.ofertas },
      { href: '/admin/cupones', label: 'Cupones', icon: ICONS.cupones },
      { href: '/admin/proveedores', label: 'Proveedores', icon: ICONS.map },
    ],
  },
  {
    label: 'Atención',
    items: [
      { href: '/admin/reservas',  label: 'Reservas',  icon: ICONS.reservas  },
      { href: '/admin/clientes',  label: 'Clientes',  icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z'  },
      { href: '/admin/marketing', label: 'Marketing', icon: ICONS.marketing },
      { href: '/admin/soporte',  label: 'Soporte',   icon: ICONS.soporte   },
      { href: '/admin/resenas', label: 'Reseñas',  icon: ICONS.resenas  },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/reportes', label: 'Reportes', icon: ICONS.reportes },
    ],
  },
]

export default function AdminSidebar() {
  const path   = usePathname()
  const router = useRouter()

  function isActive(href: string, exact?: boolean) {
    return exact ? path === href : path.startsWith(href)
  }

  const onConfig = path.startsWith('/admin/configuracion') || path.startsWith('/admin/personalizacion') || path.startsWith('/admin/usuarios')
  const configActive = onConfig

  async function logout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="w-[216px] shrink-0 flex flex-col h-screen sticky top-0 bg-dt-bg border-r border-dt-border">

      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-dt-border">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d={ICONS.map} />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-dt-text leading-tight m-0">Dominicana Tour</p>
          <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-accent leading-tight m-0 mt-0.5">Panel Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-4">
        {SECTIONS.map((section, si) => (
          <div key={si} className="px-2">
            {section.label && (
              <p className="px-3 mb-1 text-[10px] font-bold tracking-[0.12em] uppercase"
                style={{ color: 'var(--color-text-3)', opacity: 0.55 }}>
                {section.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map(item => {
                const active = isActive(item.href, item.exact)
                return (
                  <Link key={item.href} href={item.href}
                    className={[
                      'flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] font-medium no-underline transition-colors',
                      active
                        ? 'bg-accent/10 text-accent'
                        : 'text-dt-text-3 hover:bg-dt-bg-2 hover:text-dt-text',
                    ].join(' ')}>
                    <Ico d={item.icon} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom fixed ? Configuración + user + logout */}
      <div className="shrink-0 border-t border-dt-border">

        {/* Configuración pinned */}
        <div className="px-2 pt-2">
          <div>
            <Link href="/admin/configuracion"
              className={[
                'flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] font-medium no-underline transition-colors',
                configActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-dt-text-3 hover:bg-dt-bg-2 hover:text-dt-text',
              ].join(' ')}>
              <Ico d={ICONS.settings} />
              Configuración
            </Link>

            {/* Personalización sub-item */}
            {onConfig && (
              <Link href="/admin/personalizacion"
                className={[
                  'flex items-center gap-2 pl-8 pr-3 py-[6px] rounded-md text-[12px] font-medium no-underline transition-colors',
                  path.startsWith('/admin/personalizacion')
                    ? 'text-accent'
                    : 'text-dt-text-3 hover:text-dt-text',
                ].join(' ')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICONS.personalizar} />
                </svg>
                Personalización
              </Link>
            )}
          </div>
        </div>

        {/* User row */}
        <div className="px-2 pt-1.5 pb-1">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-md">
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-[10px] font-extrabold shrink-0">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-dt-text truncate leading-tight">Admin</p>
              <p className="text-[10px] text-dt-text-3 truncate leading-tight">Administrador</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="px-2 pb-2">
          <button onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 py-[7px] rounded-md text-[13px] border-none cursor-pointer bg-transparent text-dt-text-3 hover:bg-red-500/5 hover:text-red-500 transition-colors">
            <Ico d={ICONS.logout} />
            Cerrar sesión
          </button>
        </div>

      </div>
    </aside>
  )
}

