import ReservasClient from './reservas-client'
export const dynamic = 'force-dynamic'
export default function ReservasPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-dt-text mb-5">Reservas</h1>
      <ReservasClient />
    </div>
  )
}
