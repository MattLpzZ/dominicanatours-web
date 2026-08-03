'use client'
import { useEffect, useRef } from 'react'

interface Particle {
  x: number; y: number; r: number
  vx: number; vy: number; opacity: number; twinkle: number; phase: number
}

export function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let W = canvas.offsetWidth
    let H = canvas.offsetHeight
    canvas.width = W
    canvas.height = H

    const count = Math.min(Math.floor(W / 22), 55)
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x:       Math.random() * W,
      y:       Math.random() * H,
      r:       Math.random() * 1.8 + 0.4,
      vx:      (Math.random() - 0.5) * 0.25,
      vy:      -(Math.random() * 0.45 + 0.12),
      opacity: Math.random() * 0.45 + 0.08,
      twinkle: Math.random() * 0.018 + 0.004,
      phase:   Math.random() * Math.PI * 2,
    }))

    let frame = 0
    let raf: number

    function draw() {
      ctx.clearRect(0, 0, W, H)
      frame++
      for (const p of particles) {
        p.phase += p.twinkle
        const alpha = p.opacity * (0.65 + 0.35 * Math.sin(p.phase))
        ctx.beginPath()
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.2)
        grad.addColorStop(0, `rgba(255,255,255,${alpha})`)
        grad.addColorStop(1, `rgba(255,255,255,0)`)
        ctx.fillStyle = grad
        ctx.arc(p.x, p.y, p.r * 2.2, 0, Math.PI * 2)
        ctx.fill()

        p.x += p.vx
        p.y += p.vy
        if (p.y < -8)    { p.y = H + 8; p.x = Math.random() * W }
        if (p.x < -8)    p.x = W + 8
        if (p.x > W + 8) p.x = -8
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    const onResize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      style={{ zIndex: 6 }}
    />
  )
}
