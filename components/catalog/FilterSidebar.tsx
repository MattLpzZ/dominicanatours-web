'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { DifficultyBadge } from '@/components/ui/DifficultyBadge'

const DIFFICULTIES = [
  { value: 'easy',     diff: 'EASY'     as const },
  { value: 'moderate', diff: 'MODERATE' as const },
  { value: 'advanced', diff: 'ADVANCED' as const },
]

export function FilterSidebar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.push(`/excursiones?${params.toString()}`)
    },
    [router, searchParams],
  )

  const currentDiff = searchParams.get('diff')
  const currentZone = searchParams.get('zone')
  const hasFilters = currentDiff || currentZone

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-white border border-dt-border rounded-dt p-5 sticky top-24">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-dt-text text-lg">Filtros</h3>
          {hasFilters && (
            <button
              onClick={() => router.push('/excursiones')}
              className="text-xs text-accent hover:underline font-semibold"
            >
              Limpiar todo
            </button>
          )}
        </div>

        {/* Difficulty */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-dt-text-3 mb-3">Dificultad</p>
          <div className="flex flex-col gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => updateParam('diff', currentDiff === d.value ? null : d.value)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-dt-sm border transition-all duration-200 text-left ${
                  currentDiff === d.value
                    ? 'border-accent bg-accent/5'
                    : 'border-dt-border hover:border-dt-text-3'
                }`}
              >
                <DifficultyBadge difficulty={d.diff} />
                {currentDiff === d.value && (
                  <span className="text-accent text-xs font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Zone */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-dt-text-3 mb-3">Zona de salida</p>
          <input
            type="text"
            placeholder="Ej: Punta Cana"
            defaultValue={currentZone ?? ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value.trim()
                updateParam('zone', val || null)
              }
            }}
            className="w-full border border-dt-border rounded-dt-sm px-3 py-2 text-sm text-dt-text placeholder:text-dt-text-3 focus:outline-none focus:border-accent transition-colors"
          />
          <p className="text-xs text-dt-text-3 mt-1.5">Presiona Enter para filtrar</p>
        </div>
      </div>
    </aside>
  )
}
