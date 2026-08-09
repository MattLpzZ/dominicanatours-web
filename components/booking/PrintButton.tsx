'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="w-full bg-dt-bg-2 border border-dt-border text-dt-text font-semibold py-3 rounded-dt-sm hover:border-accent transition-colors text-center print:hidden"
    >
      Descargar / Imprimir PDF
    </button>
  )
}
