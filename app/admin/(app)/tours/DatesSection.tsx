"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TourDate = {
  id: number; date: string; availableSpots: number; bookedSpots: number; status: string
  _count: { reservations: number }
}
function fmtDate(d: string) {
  return new Intl.DateTimeFormat('es-DO', { weekday:'short', day:'2-digit', month:'short', year:'numeric' }).format(new Date(d))
}

export default function DatesSection({ tourId, dates: initial }: { tourId: number; dates: TourDate[] }) {
  const router = useRouter()
  const [dates, setDates] = useState(initial)
  const [newDate, setNewDate] = useState('')
  const [spots, setSpots] = useState('20')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<number|null>(null)

  async function addDate() {
    if (!newDate) return
    setAdding(true)
    const res = await fetch(`/api/admin/tours/${tourId}/dates`, {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ date: newDate, availableSpots: parseInt(spots) }),
    })
    const data = await res.json()
    if (res.ok) {
      setDates(d => [...d, { ...data.date, _count: { reservations: 0 } }])
      setNewDate(''); setSpots('20')
    }
    setAdding(false)
  }

  async function removeDate(dateId: number) {
    setRemoving(dateId)
    await fetch(`/api/admin/tours/${tourId}/dates?dateId=${dateId}`, { method: 'DELETE' })
    setDates(d => d.filter(x => x.id !== dateId))
    setRemoving(null)
    router.refresh()
  }

  return (
    <div className="bg-dt-surface rounded-xl border border-dt-border p-5">
      <h2 className="font-semibold text-dt-text text-sm mb-4">Fechas disponibles ({dates.length})</h2>
      <div className="flex gap-3 mb-5 flex-wrap">
        <input type="date" className="px-3 py-2 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-sm focus:outline-none focus:border-accent" value={newDate} onChange={e=>setNewDate(e.target.value)} />
        <input type="number" min="1" placeholder="Cupos" className="w-24 px-3 py-2 rounded-lg border border-dt-border bg-dt-bg text-dt-text text-sm focus:outline-none focus:border-accent" value={spots} onChange={e=>setSpots(e.target.value)} />
        <button onClick={addDate} disabled={adding || !newDate} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
          {adding ? 'Agregando...' : '+ Agregar fecha'}
        </button>
      </div>
      {dates.length === 0 ? (
        <p className="text-dt-text-3 text-sm">Sin fechas registradas</p>
      ) : (
        <div className="space-y-2">
          {dates.map(d => (
            <div key={d.id} className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-dt-border bg-dt-bg-2">
              <div>
                <span className="text-dt-text text-sm font-medium">{fmtDate(d.date)}</span>
                <span className="ml-3 text-dt-text-3 text-xs">{d._count.reservations} reservas / {d.availableSpots} cupos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${d.status==='OPEN'?'bg-green-100 text-green-700':d.status==='FULL'?'bg-amber-100 text-amber-700':'bg-gray-100 text-gray-500'}`}>{d.status}</span>
                {d._count.reservations === 0 && (
                  <button onClick={()=>removeDate(d.id)} disabled={removing===d.id} className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50">
                    {removing===d.id ? '...' : 'Eliminar'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}