import { cn } from '@/lib/utils'

type BadgeVariant = 'blue' | 'green' | 'gold' | 'red' | 'gray'

const variants: Record<BadgeVariant, string> = {
  blue: 'bg-accent/10 text-accent border-accent/20',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  gold: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  gray: 'bg-dt-bg-2 text-dt-text-2 border-dt-border',
}

export function Badge({ variant = 'blue', children, className }: {
  variant?: BadgeVariant; children: React.ReactNode; className?: string
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold border rounded-full',
      variants[variant], className
    )}>
      {children}
    </span>
  )
}
