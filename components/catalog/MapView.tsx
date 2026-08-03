'use client'
import { useEffect, useRef } from 'react'
import type { ApiProduct } from './ExcursionesClient'
import { getZoneCoords } from '@/lib/zones'
import { getCategoryColor } from './ExcursionesClient'

interface Props {
  tours: ApiProduct[]
  activeId: number | null
  onPinClick: (id: number) => void
  isDark?: boolean
}

const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const TILE_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

export function MapView({ tours, activeId, onPinClick, isDark = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef  = useRef<unknown>(null)
  const tileRef = useRef<unknown>(null)
  const markersRef = useRef<Map<number, unknown>>(new Map())

  // Swap tile layer when dark mode changes
  useEffect(() => {
    if (!tileRef.current) return
    ;(tileRef.current as { setUrl: (u: string) => void }).setUrl(isDark ? TILE_DARK : TILE_LIGHT)
  }, [isDark])

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    let L: typeof import('leaflet')
    let map: ReturnType<typeof import('leaflet').map>

    async function init() {
      L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      map = L.map(containerRef.current!, {
        center: [18.74, -70.16],
        zoom: 8,
        zoomControl: false,
        attributionControl: true,
      })

      mapRef.current = map
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      const tile = L.tileLayer(isDark ? TILE_DARK : TILE_LIGHT, {
        attribution: '© <a href="https://carto.com">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 18,
      }).addTo(map)
      tileRef.current = tile

      const zoneOffset = new Map<string, number>()

      tours.forEach(tour => {
        if (!tour.departure_zone) return
        const base = getZoneCoords(tour.departure_zone)
        if (!base) return

        const key = tour.departure_zone
        const count = zoneOffset.get(key) ?? 0
        zoneOffset.set(key, count + 1)
        const offsetLng = count * 0.03

        const price = Number(tour.price_adult).toFixed(0)
        const isActive = tour.id === activeId
        const catColor = getCategoryColor(tour.category?.slug ?? '')
        const dot = L.divIcon({
          html: `<div class="map-marker ${isActive ? 'map-marker--active' : ''}" style="--cat-color:${catColor}"><span>$${price}</span></div>`,
          className: '',
          iconSize: [64, 32],
          iconAnchor: [32, 32],
        })

        const marker = L.marker([base[0], base[1] + offsetLng], { icon: dot })
          .addTo(map)
          .bindPopup(`
            <div class="map-popup">
              <strong>${tour.name}</strong>
              <div class="map-popup-meta">📍 ${tour.departure_zone} · ⏱️ ${tour.duration}</div>
              <div class="map-popup-price">desde $${price} USD</div>
            </div>
          `, { offset: [0, -8], closeButton: false })
          .on('click', () => onPinClick(tour.id))

        markersRef.current.set(tour.id, marker)
      })
    }

    init()

    // Auto-resize map when container changes (e.g. filter sidebar collapse)
    let observer: ResizeObserver | null = null
    const el = containerRef.current
    if (el && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        if (mapRef.current) {
          ;(mapRef.current as ReturnType<typeof import('leaflet').map>).invalidateSize()
        }
      })
      observer.observe(el)
    }

    return () => {
      observer?.disconnect()
      if (mapRef.current) {
        ;(mapRef.current as ReturnType<typeof import('leaflet').map>).remove()
        mapRef.current = null
        tileRef.current = null
        markersRef.current.clear()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Highlight active marker + pan
  useEffect(() => {
    if (!mapRef.current) return
    markersRef.current.forEach((marker, id) => {
      const el = (marker as { getElement?: () => HTMLElement | undefined }).getElement?.()
      const dot = el?.querySelector('.map-marker')
      if (dot) dot.classList.toggle('map-marker--active', id === activeId)
    })

    if (activeId != null) {
      const tour = tours.find(t => t.id === activeId)
      if (tour) {
        const coords = tour.departure_zone ? getZoneCoords(tour.departure_zone) : null
        if (coords) {
          ;(mapRef.current as ReturnType<typeof import('leaflet').map>).panTo(coords, { animate: true, duration: 0.6 })
        }
      }
    }
  }, [activeId, tours])

  return <div ref={containerRef} className="w-full h-full min-h-[500px]" />
}
