import { cn } from '@/lib/utils'

export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-dt-surface rounded-dt border border-dt-border shadow-dt', className)} {...props}>
      {children}
    </div>
  )
}
