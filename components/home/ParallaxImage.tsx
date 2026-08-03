'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'

export function ParallaxImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onScroll = () => {
      if (ref.current) ref.current.style.transform = `translateY(${window.scrollY * 0.28}px) scale(1.3)`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div ref={ref} className="absolute inset-0 will-change-transform" style={{ transform: 'scale(1.3)' }}>
      <Image src={src} alt={alt} fill className="object-cover" priority />
    </div>
  )
}
