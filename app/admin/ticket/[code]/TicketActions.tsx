'use client'
export function TicketActions() {
  return (
    <div className="print-btn">
      <button className="btn btn-secondary" onClick={() => window.close()}>Cerrar</button>
      <button className="btn btn-primary" onClick={() => window.print()}>Imprimir ticket</button>
    </div>
  )
}
