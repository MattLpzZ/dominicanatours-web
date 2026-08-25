"use client"
import React from "react"

const C = "#1d70b7"

// Frond: filled tapered leaf, base at origin, tip at ~(0,-102)
// Slightly asymmetric for natural look
const FROND = "M0,0 C-7,-16 -11,-44 -8,-74 C-5,-86 -1,-98 0,-102 C1,-98 5,-86 8,-74 C11,-44 7,-16 0,0 Z"

// 11 fronds: angle (0=up, positive=clockwise), scale
const FRONDS: { a: number; s: number }[] = [
  { a: -138, s: 0.80 },  // far-left drooping
  { a: -112, s: 0.92 },  // left horizontal
  { a:  -88, s: 1.06 },  // upper-left
  { a:  -62, s: 1.13 },  // steep upper-left
  { a:  -36, s: 1.19 },  // near-vertical left
  { a:   -8, s: 1.22 },  // near-vertical center
  { a:   20, s: 1.19 },  // near-vertical right
  { a:   46, s: 1.13 },  // upper-right
  { a:   72, s: 1.06 },  // right
  { a:   98, s: 0.90 },  // right drooping
  { a:  122, s: 0.77 },  // far-right drooping
]

function PalmTree({ palmId, flip, style }: { palmId: string; flip?: boolean; style?: React.CSSProperties }) {
  const cx = 130, cy = 155
  const transforms = [flip ? "scaleX(-1)" : "", style?.transform ?? ""].filter(Boolean)
  return (
    <svg
      viewBox="0 0 260 540"
      aria-hidden="true"
      style={{ ...style, transform: transforms.join(" ") || undefined }}
    >
      <defs>
        <path id={palmId} d={FROND} />
      </defs>

      {/* Trunk — filled tapered shape, slightly curved */}
      <path
        d="M112,540 C110,458 114,376 116,302 C118,242 116,196 118,163
           C120,149 124,143 130,141
           C136,143 140,149 142,163
           C144,196 142,242 144,302 C146,376 150,458 148,540 Z"
        fill={C}
      />

      {/* Fronds via <use> at rotated positions */}
      {FRONDS.map(({ a, s }, i) => (
        <use
          key={i}
          href={`#${palmId}`}
          transform={`translate(${cx},${cy}) rotate(${a}) scale(${s})`}
          fill={C}
        />
      ))}

      {/* Coconut cluster at crown */}
      <circle cx={124} cy={162} r={9}  fill={C} />
      <circle cx={135} cy={156} r={8}  fill={C} />
      <circle cx={131} cy={168} r={7}  fill={C} />
    </svg>
  )
}

function Birds({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <path d="M0,0 C9,-8 18,-8 26,0 C34,-8 43,-8 52,0" stroke={C} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function TropicalScene() {
  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", overflow: "hidden" }}>

      {/* LEFT palm */}
      <PalmTree palmId="pl" style={{ position: "absolute", left: -28, bottom: 0, height: "65vh", minHeight: 340, maxHeight: 620, opacity: 0.075 }} />

      {/* RIGHT palm large */}
      <PalmTree palmId="pr" flip style={{ position: "absolute", right: -28, bottom: 0, height: "58vh", minHeight: 300, maxHeight: 560, opacity: 0.065 }} />

      {/* RIGHT palm small */}
      <PalmTree palmId="pr2" flip style={{ position: "absolute", right: 88, bottom: 0, height: "36vh", minHeight: 190, maxHeight: 360, opacity: 0.038 }} />

      {/* OCEAN WAVES */}
      <svg viewBox="0 0 1440 110" preserveAspectRatio="none"
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, width: "100%", height: 110 }}>
        <path d="M0,55 C200,20 400,90 600,55 C800,22 1000,85 1200,55 C1320,38 1440,62 1440,62 L1440,110 L0,110 Z" fill={C} opacity="0.045" />
        <path d="M0,72 C240,42 480,98 720,72 C960,46 1200,90 1440,72 L1440,110 L0,110 Z" fill={C} opacity="0.030" />
        <path d="M0,88 C300,68 600,105 900,88 C1100,76 1300,96 1440,88 L1440,110 L0,110 Z" fill={C} opacity="0.020" />
      </svg>

      {/* MOUNTAIN SILHOUETTE */}
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none"
        style={{ position: "absolute", bottom: 90, left: 0, right: 0, width: "100%", height: 80, opacity: 0.026 }}>
        <path d="M0,80 L180,18 L340,55 L520,5 L680,45 L860,12 L1020,50 L1180,8 L1360,40 L1440,22 L1440,80 Z" fill={C} />
      </svg>

      {/* BIRDS — top right cluster */}
      <svg viewBox="0 0 300 160" style={{ position: "absolute", top: "12%", right: "6%", width: 220, opacity: 0.072 }}>
        <Birds x={30}  y={30}  scale={1.4} />
        <Birds x={100} y={18}  scale={1.1} />
        <Birds x={170} y={42}  scale={0.9} />
        <Birds x={60}  y={75}  scale={0.75} />
        <Birds x={140} y={90}  scale={0.65} />
        <Birds x={220} y={65}  scale={0.8} />
        <Birds x={200} y={22}  scale={0.6} />
      </svg>

      {/* BIRDS — top left sparse */}
      <svg viewBox="0 0 200 120" style={{ position: "absolute", top: "18%", left: "8%", width: 160, opacity: 0.052 }}>
        <Birds x={20}  y={40} scale={1.0} />
        <Birds x={90}  y={25} scale={0.8} />
        <Birds x={150} y={55} scale={0.65} />
      </svg>

      {/* COMPASS ROSE */}
      <svg viewBox="0 0 100 100" style={{ position: "absolute", bottom: 130, right: 32, width: 88, opacity: 0.065 }}>
        <circle cx="50" cy="50" r="46" fill="none" stroke={C} strokeWidth="0.8" />
        <circle cx="50" cy="50" r="34" fill="none" stroke={C} strokeWidth="0.4" />
        <circle cx="50" cy="50" r="5"  fill={C} opacity="0.5" />
        <line x1="50" y1="4"  x2="50" y2="16" stroke={C} strokeWidth="2"   strokeLinecap="round" />
        <line x1="50" y1="84" x2="50" y2="96" stroke={C} strokeWidth="2"   strokeLinecap="round" />
        <line x1="4"  y1="50" x2="16" y2="50" stroke={C} strokeWidth="2"   strokeLinecap="round" />
        <line x1="84" y1="50" x2="96" y2="50" stroke={C} strokeWidth="2"   strokeLinecap="round" />
        <line x1="18" y1="18" x2="24" y2="24" stroke={C} strokeWidth="1"   strokeLinecap="round" />
        <line x1="76" y1="18" x2="82" y2="24" stroke={C} strokeWidth="1"   strokeLinecap="round" />
        <line x1="18" y1="82" x2="24" y2="76" stroke={C} strokeWidth="1"   strokeLinecap="round" />
        <line x1="76" y1="82" x2="82" y2="76" stroke={C} strokeWidth="1"   strokeLinecap="round" />
        <path d="M50,18 L54,50 L50,58 L46,50 Z" fill={C} />
        <path d="M50,82 L54,50 L50,58 L46,50 Z" fill={C} opacity="0.3" />
        <text x="50" y="11" textAnchor="middle" fontSize="7" fontWeight="bold" fill={C} fontFamily="sans-serif">N</text>
      </svg>

      {/* TROPICAL LEAF accent — top-left corner */}
      <svg viewBox="0 0 120 120"
        style={{ position: "absolute", top: -10, left: -10, width: 130, opacity: 0.048, transform: "rotate(25deg)" }}>
        <path d="M10,110 Q-10,60 30,20 Q50,-5 90,10 Q50,15 35,40 Q20,70 30,110 Z" fill={C} />
        <path d="M10,110 Q40,70 90,10" stroke={C} strokeWidth="1.5" fill="none" opacity="0.5" />
      </svg>

    </div>
  )
}
