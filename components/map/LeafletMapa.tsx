"use client"
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { ApiProduct } from '@/components/catalog/ExcursionesClient'
import { getZoneCoords } from '@/lib/zones'

function getCatColor(slug: string): string {
  const s = slug?.toLowerCase() ?? ''
  if (s.includes('playa') || s.includes('mar'))     return '#0099CC'
  if (s.includes('aventura'))                        return '#22C55E'
  if (s.includes('cultur') || s.includes('histor')) return '#F59E0B'
  if (s.includes('fauna') || s.includes('natural')) return '#10B981'
  if (s.includes('noctur'))                         return '#8B5CF6'
  return '#E85D20'
}

function makePriceMarker(price: string, color: string, active: boolean) {
  const label = `${Number(price).toFixed(0)} USD`
  const bg = active ? '#E85D20' : color
  const scale = active ? 'scale(1.15)' : 'scale(1)'
  const shadow = active
    ? '0 4px 20px rgba(232,93,32,.55), 0 0 0 3px rgba(232,93,32,.2)'
    : '0 2px 8px rgba(0,0,0,.45)'
  return L.divIcon({
    className: '',
    html: `
      <div style="
        display:inline-flex;align-items:center;justify-content:center;
        background:${bg};
        color:#fff;
        font-family:system-ui,-apple-system,sans-serif;
        font-size:11px;font-weight:700;
        padding:4px 9px;
        border-radius:20px;
        white-space:nowrap;
        box-shadow:${shadow};
        transform:${scale};
        transform-origin:center bottom;
        transition:all .2s;
        position:relative;
        border:2px solid rgba(255,255,255,.25);
      ">
        ${label}
        <div style="
          position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);
          width:0;height:0;
          border-left:5px solid transparent;
          border-right:5px solid transparent;
          border-top:6px solid ${bg};
        "></div>
      </div>`,
    iconSize: [70, 30],
    iconAnchor: [35, 36],
    popupAnchor: [0, -38],
  })
}

function jitter() { return (Math.random() - 0.5) * 0.03 }

interface Props {
  tours: ApiProduct[]
  activeId: number | null
  onPinClick: (id: number) => void
  isDark?: boolean
}

export function LeafletMapa({ tours, activeId, onPinClick, isDark = true }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<L.Map | null>(null)
  const markersRef    = useRef<Map<number, L.Marker>>(new Map())
  const coordsRef     = useRef<Map<number, [number, number]>>(new Map())

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      center: [18.7, -70.2],
      zoom: 8,
      zoomControl: false,
      scrollWheelZoom: true,
    })

    const tile = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

    L.tileLayer(tile, { attribution: '© Dominicana Tour', maxZoom: 18 }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapRef.current = map
  }, [isDark])

  // Render markers when tours change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()
    coordsRef.current.clear()

    // Group tours by zone to avoid complete overlap
    tours.forEach(tour => {
      const zone  = tour.departure_zone ?? ''
      const base  = getZoneCoords(zone) ?? [18.7357, -70.1627]
      const lat   = base[0] + jitter()
      const lng   = base[1] + jitter()
      const color = getCatColor(tour.category?.slug ?? '')
      const isActive = tour.id === activeId

      coordsRef.current.set(tour.id, [lat, lng])

      const marker = L.marker([lat, lng], {
        icon: makePriceMarker(tour.price_adult, color, isActive),
        zIndexOffset: isActive ? 1000 : 0,
      })
        .addTo(map)
        .on('click', () => onPinClick(tour.id))

      markersRef.current.set(tour.id, marker)
    })
  }, [tours, onPinClick]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update active marker appearance without full re-render
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker, id) => {
      const tour = tours.find(t => t.id === id)
      if (!tour) return
      const color = getCatColor(tour.category?.slug ?? '')
      const isActive = id === activeId
      marker.setIcon(makePriceMarker(tour.price_adult, color, isActive))
      marker.setZIndexOffset(isActive ? 1000 : 0)
    })

    // Pan to active tour
    if (activeId) {
      const coords = coordsRef.current.get(activeId)
      if (coords) map.panTo(coords, { animate: true, duration: 0.4 })
    }
  }, [activeId, tours])

  // Fit bounds when tours first load
  useEffect(() => {
    const map = mapRef.current
    if (!map || tours.length === 0) return
    const points = tours.map(t => {
      const zone = t.departure_zone ?? ''
      return getZoneCoords(zone) ?? [18.7357, -70.1627] as [number, number]
    }) as [number, number][]
    if (points.length > 0) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 })
    }
  }, [tours.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
