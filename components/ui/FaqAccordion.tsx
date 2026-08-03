'use client'
import { useState } from 'react'

interface FaqItem { question: string; answer: string }

export function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="space-y-2">
      {faqs.map(({ question, answer }, i) => (
        <div key={i} className={`rounded-xl border transition-all duration-200 ${open === i ? 'border-accent/25 bg-accent/3' : 'border-dt-border bg-dt-surface hover:border-dt-border/70'}`}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
          >
            <span className={`font-semibold text-sm leading-snug transition-colors ${open === i ? 'text-accent' : 'text-dt-text'}`}>{question}</span>
            <span className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 ${open === i ? 'border-accent bg-accent text-white rotate-45' : 'border-dt-border text-dt-text-3'}`}>
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
            </span>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${open === i ? 'max-h-96' : 'max-h-0'}`}>
            <p className="px-5 pb-5 text-dt-text-3 text-sm leading-relaxed">{answer}</p>
          </div>
        </div>
      ))}
    </div>
  )
}