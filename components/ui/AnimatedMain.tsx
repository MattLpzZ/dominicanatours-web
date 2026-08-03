'use client'
import { usePathname } from 'next/navigation'

export function AnimatedMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <main key={pathname} className="animate-page-in">{children}</main>
}
