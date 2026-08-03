'use client'
import { useRouter, usePathname } from 'next/navigation'

export default function ReportesNav({ tab, month }: { tab: string; month: string }) {
  const router = useRouter()
  const path   = usePathname()

  function go(newTab: string, newMonth?: string) {
    const m = newMonth ?? month
    router.push(`${path}?tab=${newTab}&month=${m}`)
  }

  // Build last 12 months options
  const now = new Date()
  const months: { value: string; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const label = d.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })
    months.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Tabs */}
      <div className="flex gap-1 bg-dt-bg-2 border border-dt-border rounded-xl p-0.5">
        {[
          { key: 'resumen',  label: 'Resumen' },
          { key: 'clientes', label: 'Clientes' },
        ].map(t => (
          <button key={t.key} onClick={() => go(t.key)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${tab === t.key ? 'bg-accent text-white' : 'text-dt-text-3 hover:text-dt-text hover:bg-dt-surface'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Month selector */}
      <select
        value={month}
        onChange={e => go(tab, e.target.value)}
        className="px-3 py-1.5 border border-dt-border rounded-lg bg-dt-bg text-dt-text text-[13px] focus:outline-none focus:border-accent cursor-pointer"
      >
        {months.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
    </div>
  )
}
