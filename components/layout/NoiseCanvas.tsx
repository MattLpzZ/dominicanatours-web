"use client"
import { useEffect, useRef } from "react"

const PALETTE: readonly [number, number, number][] = [
  [29,  112, 183],
  [20,  184, 166],
  [56,  189, 248],
  [96,  165, 250],
  [14,  165, 233],
]

export function NoiseCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const canvas = ref.current!
    const ctx = canvas.getContext("2d")!
    const isDark = document.documentElement.classList.contains("dark")
    const bg = isDark ? "#060A10" : "#FFFFFF"
    const fade = isDark ? "rgba(6,10,16,0.022)" : "rgba(255,255,255,0.022)"

    let W = 0, H = 0

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
    }
    resize()

    const N = Math.min(170, Math.floor((W * H) / 5500))
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 1.9 + 0.4,
      speed: Math.random() * 0.55 + 0.15,
      alpha: Math.random() * 0.24 + 0.04,
      rgb: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    }))

    let t = 0, raf = 0

    function frame() {
      ctx.fillStyle = fade
      ctx.fillRect(0, 0, W, H)

      const s = 0.0026
      for (const p of pts) {
        const a =
          Math.sin(p.x * s + t * 0.38) * Math.PI * 2 +
          Math.cos(p.y * s + t * 0.24) * Math.PI

        p.x += Math.cos(a) * p.speed
        p.y += Math.sin(a) * p.speed

        if (p.x < -4) p.x = W + 4
        if (p.x > W + 4) p.x = -4
        if (p.y < -4) p.y = H + 4
        if (p.y > H + 4) p.y = -4

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.rgb[0]},${p.rgb[1]},${p.rgb[2]},${p.alpha})`
        ctx.fill()
      }

      t += 0.0032
      raf = requestAnimationFrame(frame)
    }

    frame()
    window.addEventListener("resize", resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize) }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
    />
  )
}
