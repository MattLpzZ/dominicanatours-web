import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'outline' | 'gold' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  asChild?: boolean
  href?: string
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent/90',
  secondary: 'bg-dt-bg-2 text-dt-text border border-dt-border hover:border-accent hover:text-accent',
  outline: 'border-2 border-white text-white hover:bg-white/10',
  gold: 'bg-gold text-white hover:bg-gold/90',
  ghost: 'text-dt-text-2 hover:text-accent hover:bg-dt-bg-2',
}

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 font-semibold rounded-dt-sm transition-all duration-200 cursor-pointer',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
