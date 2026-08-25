"use client"
import { useEffect } from "react"

export function NoiseCanvas() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const SIZE = 256
    const offscreen = document.createElement("canvas")
    offscreen.width = offscreen.height = SIZE
    const ctx = offscreen.getContext("2d")!
    const img = ctx.createImageData(SIZE, SIZE)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0
      d[i] = d[i + 1] = d[i + 2] = v
      d[i + 3] = (Math.random() * 28 + 4) | 0
    }
    ctx.putImageData(img, 0, 0)
    const tileUrl = offscreen.toDataURL()

    if (!document.getElementById("grain-kf")) {
      const s = document.createElement("style")
      s.id = "grain-kf"
      s.textContent = `
        @keyframes grain-shift {
          0%  { transform: translate(0,0) }
          10% { transform: translate(-2%,-6%) }
          20% { transform: translate(-9%,3%) }
          30% { transform: translate(4%,-13%) }
          40% { transform: translate(-3%,14%) }
          50% { transform: translate(-9%,5%) }
          60% { transform: translate(9%,0) }
          70% { transform: translate(0,9%) }
          80% { transform: translate(2%,19%) }
          90% { transform: translate(-5%,5%) }
        }
      `
      document.head.appendChild(s)
    }

    const overlay = document.createElement("div")
    overlay.setAttribute("data-grain", "true")
    overlay.setAttribute("aria-hidden", "true")
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "-150%",
      width: "400%",
      height: "400%",
      zIndex: "3",
      pointerEvents: "none",
      backgroundImage: `url(${tileUrl})`,
      backgroundSize: `${SIZE}px ${SIZE}px`,
      opacity: "0.09",
      animation: "grain-shift 0.45s steps(1) infinite",
    })
    document.body.appendChild(overlay)

    return () => overlay.remove()
  }, [])

  return null
}
