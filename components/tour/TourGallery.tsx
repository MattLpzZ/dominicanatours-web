'use client'
import Image from 'next/image'
import { useState } from 'react'

interface ApiImage {
  url: string
  alt: string | null
}

export function TourGallery({ images }: { images: ApiImage[] }) {
  const [active, setActive] = useState(0)
  if (!images.length) return null

  return (
    <div className="mb-8">
      <div className="relative h-72 md:h-96 rounded-dt overflow-hidden mb-3">
        <Image src={images[active].url} alt={images[active].alt ?? ''} fill className="object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`relative w-20 h-14 rounded-dt-sm overflow-hidden border-2 transition-colors ${i === active ? 'border-accent' : 'border-transparent'}`}>
              <Image src={img.url} alt={img.alt ?? ''} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
