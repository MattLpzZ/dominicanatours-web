"use client"

const C = "#1d70b7"

function PalmTree({ flip = false, style }: { flip?: boolean; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 140 480"
      aria-hidden="true"
      style={{ ...style, transform: flip ? "scaleX(-1)" : undefined }}
    >
      {/* trunk — slight S-curve */}
      <path
        d="M70,480 C72,400 66,320 70,255 C72,200 66,165 70,135 C69,118 66,104 63,92"
        stroke={C} strokeWidth="10" fill="none" strokeLinecap="round"
      />
      {/* coconuts */}
      <circle cx="60" cy="100" r="7" fill={C} />
      <circle cx="68" cy="112" r="6" fill={C} />
      {/* fronds */}
      <path d="M63,92 Q28,72 -8,48"  stroke={C} strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M63,92 Q32,50 14,20"  stroke={C} strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M63,92 Q60,42 55,8"   stroke={C} strokeWidth="4.5" fill="none" strokeLinecap="round"/>
      <path d="M63,92 Q85,48 110,22" stroke={C} strokeWidth="4.5" fill="none" strokeLinecap="round"/>
      <path d="M63,92 Q98,70 132,62" stroke={C} strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M63,92 Q100,98 135,105" stroke={C} strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M63,92 Q26,100 -4,110" stroke={C} strokeWidth="4" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

function Birds({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const s = scale
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M0,0 C9,-8 18,-8 26,0 C34,-8 43,-8 52,0" stroke={C} strokeWidth="2" fill="none" strokeLinecap="round"/>
    </g>
  )
}

export function TropicalScene() {
  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", overflow: "hidden" }}
    >
      {/* === PALM LEFT === */}
      <PalmTree
        style={{
          position: "absolute", left: -28, bottom: 0,
          height: "62vh", minHeight: 320, maxHeight: 580,
          opacity: 0.072,
        }}
      />

      {/* === PALM RIGHT (big) === */}
      <PalmTree
        flip
        style={{
          position: "absolute", right: -28, bottom: 0,
          height: "56vh", minHeight: 280, maxHeight: 520,
          opacity: 0.065,
        }}
      />

      {/* === PALM RIGHT (small, offset) === */}
      <PalmTree
        flip
        style={{
          position: "absolute", right: 80, bottom: 0,
          height: "38vh", minHeight: 180, maxHeight: 360,
          opacity: 0.042,
        }}
      />

      {/* === OCEAN WAVES === */}
      <svg
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, width: "100%", height: 110 }}
      >
        <path
          d="M0,55 C200,20 400,90 600,55 C800,22 1000,85 1200,55 C1320,38 1440,62 1440,62 L1440,110 L0,110 Z"
          fill={C} opacity="0.045"
        />
        <path
          d="M0,72 C240,42 480,98 720,72 C960,46 1200,90 1440,72 L1440,110 L0,110 Z"
          fill={C} opacity="0.032"
        />
        <path
          d="M0,88 C300,68 600,105 900,88 C1100,76 1300,96 1440,88 L1440,110 L0,110 Z"
          fill={C} opacity="0.022"
        />
      </svg>

      {/* === MOUNTAIN HORIZON === */}
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        style={{ position: "absolute", bottom: 90, left: 0, right: 0, width: "100%", height: 80, opacity: 0.028 }}
      >
        <path
          d="M0,80 L180,18 L340,55 L520,5 L680,45 L860,12 L1020,50 L1180,8 L1360,40 L1440,22 L1440,80 Z"
          fill={C}
        />
      </svg>

      {/* === FLYING BIRDS (top-right cluster) === */}
      <svg
        viewBox="0 0 300 160"
        style={{ position: "absolute", top: "12%", right: "6%", width: 220, opacity: 0.075 }}
      >
        <Birds x={30}  y={30}  scale={1.4} />
        <Birds x={100} y={18}  scale={1.1} />
        <Birds x={170} y={42}  scale={0.9} />
        <Birds x={60}  y={75}  scale={0.75} />
        <Birds x={140} y={90}  scale={0.65} />
        <Birds x={220} y={65}  scale={0.8} />
        <Birds x={200} y={22}  scale={0.6} />
      </svg>

      {/* === FLYING BIRDS (top-left, sparse) === */}
      <svg
        viewBox="0 0 200 120"
        style={{ position: "absolute", top: "18%", left: "8%", width: 160, opacity: 0.055 }}
      >
        <Birds x={20}  y={40} scale={1.0} />
        <Birds x={90}  y={25} scale={0.8} />
        <Birds x={150} y={55} scale={0.65} />
      </svg>

      {/* === COMPASS ROSE (bottom-right) === */}
      <svg
        viewBox="0 0 100 100"
        style={{ position: "absolute", bottom: 130, right: 32, width: 88, opacity: 0.068 }}
      >
        <circle cx="50" cy="50" r="46" fill="none" stroke={C} strokeWidth="0.8"/>
        <circle cx="50" cy="50" r="34" fill="none" stroke={C} strokeWidth="0.4"/>
        <circle cx="50" cy="50" r="5"  fill={C} opacity="0.5"/>
        {/* Cardinal ticks */}
        <line x1="50" y1="4"  x2="50" y2="16" stroke={C} strokeWidth="2" strokeLinecap="round"/>
        <line x1="50" y1="84" x2="50" y2="96" stroke={C} strokeWidth="2" strokeLinecap="round"/>
        <line x1="4"  y1="50" x2="16" y2="50" stroke={C} strokeWidth="2" strokeLinecap="round"/>
        <line x1="84" y1="50" x2="96" y2="50" stroke={C} strokeWidth="2" strokeLinecap="round"/>
        {/* Diagonal ticks */}
        <line x1="18" y1="18" x2="24" y2="24" stroke={C} strokeWidth="1" strokeLinecap="round"/>
        <line x1="76" y1="18" x2="82" y2="24" stroke={C} strokeWidth="1" strokeLinecap="round"/>
        <line x1="18" y1="82" x2="24" y2="76" stroke={C} strokeWidth="1" strokeLinecap="round"/>
        <line x1="76" y1="82" x2="82" y2="76" stroke={C} strokeWidth="1" strokeLinecap="round"/>
        {/* N needle (pointing up, blue) */}
        <path d="M50,18 L54,50 L50,58 L46,50 Z" fill={C}/>
        {/* S needle (pointing down, faint) */}
        <path d="M50,82 L54,50 L50,58 L46,50 Z" fill={C} opacity="0.3"/>
        {/* N label */}
        <text x="50" y="11" textAnchor="middle" fontSize="7" fontWeight="bold" fill={C} fontFamily="sans-serif">N</text>
      </svg>

      {/* === TROPICAL LEAF (top-left corner accent) === */}
      <svg
        viewBox="0 0 120 120"
        style={{ position: "absolute", top: -10, left: -10, width: 130, opacity: 0.05, transform: "rotate(25deg)" }}
      >
        <path
          d="M10,110 Q-10,60 30,20 Q50,-5 90,10 Q50,15 35,40 Q20,70 30,110 Z"
          fill={C}
        />
        <path d="M10,110 Q40,70 90,10" stroke={C} strokeWidth="1.5" fill="none" opacity="0.5"/>
      </svg>
    </div>
  )
}
