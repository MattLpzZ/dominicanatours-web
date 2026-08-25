"use client"

export function TropicalBackground() {
  return (
    <>
      <style>{`
        @keyframes trop1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(55px,-35px) scale(1.12); }
          66%      { transform: translate(-25px,45px) scale(0.93); }
        }
        @keyframes trop2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(-65px,25px) scale(1.08); }
          75%      { transform: translate(35px,-50px) scale(0.91); }
        }
        @keyframes trop3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(30px,60px) scale(1.06); }
        }
        @keyframes waveSway {
          0%,100% { transform: translateX(0); }
          50%      { transform: translateX(-2.5%); }
        }
        @keyframes palmSway {
          0%,100% { transform-origin: bottom center; transform: rotate(-4deg); }
          50%      { transform-origin: bottom center; transform: rotate(3deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .t-orb, .t-wave, .t-palm { animation: none !important; }
        }
        .dark .t-orb-1 { background: radial-gradient(ellipse at 40% 40%, rgba(29,112,183,0.18) 0%, transparent 65%) !important; }
        .dark .t-orb-2 { background: radial-gradient(ellipse at 60% 60%, rgba(20,184,166,0.13) 0%, transparent 65%) !important; }
        .dark .t-orb-3 { background: radial-gradient(ellipse at 50% 50%, rgba(56,189,248,0.11) 0%, transparent 65%) !important; }
      `}</style>

      <div
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none", overflow: "hidden" }}
      >
        {/* Orb 1 — deep ocean blue (top-left) */}
        <div
          className="t-orb t-orb-1"
          style={{
            position: "absolute", top: "-35%", left: "-20%",
            width: "85vw", height: "75vh", borderRadius: "50%",
            background: "radial-gradient(ellipse at 40% 40%, rgba(29,112,183,0.10) 0%, transparent 65%)",
            animation: "trop1 24s ease-in-out infinite",
          }}
        />

        {/* Orb 2 — Caribbean teal (bottom-right) */}
        <div
          className="t-orb t-orb-2"
          style={{
            position: "absolute", bottom: "-30%", right: "-20%",
            width: "75vw", height: "70vh", borderRadius: "50%",
            background: "radial-gradient(ellipse at 60% 60%, rgba(20,184,166,0.07) 0%, transparent 65%)",
            animation: "trop2 30s ease-in-out infinite",
          }}
        />

        {/* Orb 3 — tropical sky (top-right center) */}
        <div
          className="t-orb t-orb-3"
          style={{
            position: "absolute", top: "15%", right: "-5%",
            width: "55vw", height: "55vh", borderRadius: "50%",
            background: "radial-gradient(ellipse at 50% 50%, rgba(56,189,248,0.06) 0%, transparent 65%)",
            animation: "trop3 20s ease-in-out infinite",
          }}
        />

        {/* Palm silhouette — top left corner */}
        <svg
          className="t-palm"
          viewBox="0 0 220 200"
          style={{
            position: "absolute", top: -10, left: -10,
            width: 220, height: 200, opacity: 0.055,
            animation: "palmSway 8s ease-in-out infinite",
            fill: "rgba(29,112,183,1)",
          }}
        >
          {/* trunk */}
          <path d="M80,200 Q78,150 82,120 Q84,105 80,90" stroke="rgba(29,112,183,0.9)" strokeWidth="6" fill="none"/>
          {/* fronds radiating from crown */}
          <ellipse cx="80" cy="90" rx="60" ry="8" transform="rotate(-30 80 90)" opacity="0.9"/>
          <ellipse cx="80" cy="90" rx="55" ry="7" transform="rotate(-10 80 90)" opacity="0.85"/>
          <ellipse cx="80" cy="90" rx="50" ry="7" transform="rotate(15 80 90)" opacity="0.8"/>
          <ellipse cx="80" cy="90" rx="45" ry="6" transform="rotate(40 80 90)" opacity="0.75"/>
          <ellipse cx="80" cy="90" rx="40" ry="6" transform="rotate(-55 80 90)" opacity="0.7"/>
          <ellipse cx="80" cy="90" rx="35" ry="5" transform="rotate(65 80 90)" opacity="0.65"/>
        </svg>

        {/* Palm silhouette — bottom right corner (mirrored) */}
        <svg
          className="t-palm"
          viewBox="0 0 220 200"
          style={{
            position: "absolute", bottom: -10, right: -10,
            width: 200, height: 180, opacity: 0.045,
            transform: "scaleX(-1) rotate(15deg)",
            animation: "palmSway 10s ease-in-out infinite reverse",
            fill: "rgba(20,184,166,1)",
          }}
        >
          <path d="M80,200 Q78,150 82,120 Q84,105 80,90" stroke="rgba(20,184,166,0.9)" strokeWidth="6" fill="none"/>
          <ellipse cx="80" cy="90" rx="60" ry="8" transform="rotate(-30 80 90)" opacity="0.9"/>
          <ellipse cx="80" cy="90" rx="55" ry="7" transform="rotate(-10 80 90)" opacity="0.85"/>
          <ellipse cx="80" cy="90" rx="50" ry="7" transform="rotate(15 80 90)" opacity="0.8"/>
          <ellipse cx="80" cy="90" rx="45" ry="6" transform="rotate(40 80 90)" opacity="0.75"/>
          <ellipse cx="80" cy="90" rx="40" ry="6" transform="rotate(-55 80 90)" opacity="0.7"/>
          <ellipse cx="80" cy="90" rx="35" ry="5" transform="rotate(65 80 90)" opacity="0.65"/>
        </svg>

        {/* Animated wave band at the bottom */}
        <div
          className="t-wave"
          style={{
            position: "absolute", bottom: -4, left: 0, right: 0,
            animation: "waveSway 14s ease-in-out infinite",
          }}
        >
          <svg
            viewBox="0 0 1440 90"
            preserveAspectRatio="none"
            style={{ display: "block", width: "108%", marginLeft: "-4%", height: 90 }}
          >
            <path
              d="M0,45 C120,75 240,12 360,45 C480,78 600,10 720,45 C840,80 960,10 1080,45 C1200,80 1320,12 1440,45 L1440,90 L0,90 Z"
              fill="rgba(29,112,183,0.045)"
            />
            <path
              d="M0,60 C160,88 320,28 480,60 C640,92 800,22 960,60 C1120,92 1280,28 1440,60 L1440,90 L0,90 Z"
              fill="rgba(29,112,183,0.03)"
            />
          </svg>
        </div>
      </div>
    </>
  )
}
