function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-dt-border ${className}`} />
}

export default function Loading() {
  return (
    <div className="dt-sec">
      {/* Filter bar skeleton */}
      <div className="sticky top-[104px] z-40 bg-dt-bg border-b border-dt-border">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-3 flex items-center gap-2.5 overflow-x-auto">
          <Pulse className="h-8 w-40 flex-shrink-0 rounded-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Pulse key={i} className="h-8 w-24 flex-shrink-0 rounded-full" />
          ))}
        </div>
      </div>
      {/* Cards grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-dt-border overflow-hidden">
              <div className="w-full bg-dt-border animate-pulse" style={{ aspectRatio: '3/2' }} />
              <div className="p-3.5 space-y-2.5">
                <Pulse className="h-3 w-28" />
                <Pulse className="h-4 w-full" />
                <div className="flex justify-between pt-0.5">
                  <Pulse className="h-3.5 w-16" />
                  <Pulse className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
