function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-dt-border ${className}`} />
}

function CardSkeleton() {
  return (
    <div className="rounded-lg border border-dt-border overflow-hidden">
      <div className="w-full bg-dt-border animate-pulse" style={{ aspectRatio: '3/2' }} />
      <div className="p-3.5 space-y-2">
        <Pulse className="h-3 w-28" />
        <Pulse className="h-4 w-full" />
        <div className="flex justify-between pt-1">
          <Pulse className="h-3 w-16" />
          <Pulse className="h-4 w-14" />
        </div>
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <>
      {/* Hero */}
      <section className="dt-sec px-4 py-20 sm:py-24">
        <div className="max-w-[640px] mx-auto text-center space-y-4">
          <Pulse className="h-3 w-36 mx-auto" />
          <Pulse className="h-10 w-4/5 mx-auto" />
          <Pulse className="h-5 w-3/5 mx-auto" />
          <Pulse className="h-14 max-w-[560px] mx-auto rounded-full" />
        </div>
      </section>

      {/* Destinos scroll */}
      <section className="dt-sec py-[52px] px-4 sm:px-8">
        <div className="max-w-[1400px] mx-auto">
          <Pulse className="h-3 w-24 mb-2" />
          <Pulse className="h-6 w-56 mb-7" />
          <div className="flex gap-3.5 overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[176px] space-y-2">
                <Pulse className="w-[176px] h-[176px]" />
                <Pulse className="h-3.5 w-28" />
                <Pulse className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ranking */}
      <section className="dt-sec py-[52px] px-4 sm:px-8">
        <div className="max-w-[1400px] mx-auto">
          <Pulse className="h-3 w-28 mb-2" />
          <Pulse className="h-6 w-52 mb-7" />
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid items-center gap-4 py-[15px]"
                style={{ gridTemplateColumns: '28px 60px 1fr auto' }}>
                <Pulse className="h-4 w-5 ml-auto" />
                <Pulse className="w-[60px] h-[60px] rounded-[5px]" />
                <div className="space-y-1.5">
                  <Pulse className="h-4 w-3/4" />
                  <Pulse className="h-3 w-1/2" />
                </div>
                <div className="space-y-1 text-right">
                  <Pulse className="h-3 w-10 ml-auto" />
                  <Pulse className="h-4 w-14 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Atracciones grid */}
      <section className="dt-sec py-[52px] px-4 sm:px-8">
        <div className="max-w-[1400px] mx-auto">
          <Pulse className="h-3 w-24 mb-2" />
          <Pulse className="h-6 w-52 mb-7" />
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        </div>
      </section>
    </>
  )
}
