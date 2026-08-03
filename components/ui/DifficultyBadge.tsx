import { cn } from '@/lib/utils'

const DIFF = {
  EASY: {
    icon: '🌿',
    label: 'Fácil',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 diff-easy',
  },
  MODERATE: {
    icon: '⛰️',
    label: 'Moderado',
    className: 'bg-amber-50 text-amber-700 border-amber-200 diff-moderate',
  },
  ADVANCED: {
    icon: '⚡',
    label: 'Avanzado',
    className: 'bg-red-50 text-red-700 border-red-200 diff-hard',
  },
} as const

type Difficulty = keyof typeof DIFF

export function DifficultyBadge({
  difficulty,
  size = 'sm',
  className,
}: {
  difficulty: Difficulty
  size?: 'sm' | 'md'
  className?: string
}) {
  const d = DIFF[difficulty]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold border rounded-full select-none transition-transform hover:scale-105',
        d.className,
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3.5 py-1 text-sm',
        className,
      )}
    >
      <span>{d.icon}</span>
      {d.label}
    </span>
  )
}
