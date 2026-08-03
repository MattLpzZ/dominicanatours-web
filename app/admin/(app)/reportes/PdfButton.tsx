'use client'
export default function PdfButton() {
  return (
    <button
      onClick={() => window.open('/api/admin/reportes/pdf', '_blank')}
      className="flex items-center gap-2 px-4 py-2 bg-dt-bg-2 border border-dt-border text-dt-text text-[13px] font-semibold rounded-xl hover:border-accent hover:text-accent transition-colors"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2zM9 17h6M9 13h6M9 9h2"/>
      </svg>
      Generar PDF
    </button>
  )
}
