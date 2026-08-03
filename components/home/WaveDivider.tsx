export function WaveDivider({ fill = '#ffffff' }: { fill?: string }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 20, lineHeight: 0 }}
      aria-hidden
    >
      {/* Back wave — slower, more transparent */}
      <div className="absolute bottom-0 left-0 w-[200%] h-16 sm:h-20 dt-wave-back">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-full">
          <path
            fill={fill}
            fillOpacity="0.35"
            d="M0,50 C180,10 360,70 540,40 C720,10 900,70 1080,40 C1260,10 1380,60 1440,50 L1440,80 L0,80 Z"
          />
        </svg>
      </div>
      {/* Front wave — faster, solid */}
      <div className="absolute bottom-0 left-0 w-[200%] h-14 sm:h-[72px] dt-wave-front">
        <svg viewBox="0 0 1440 72" preserveAspectRatio="none" className="w-full h-full">
          <path
            fill={fill}
            d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,72 L0,72 Z"
          />
        </svg>
      </div>
    </div>
  )
}
