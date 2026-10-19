/**
 * NewsFeedBg — lightweight SVG + CSS animated hero background for the Dashboard.
 * Evokes a premium editorial / global news platform:
 *   - Faint world-map latitude/longitude grid that slowly drifts
 *   - Glowing data-point "hotspots" that pulse rhythmically
 *   - Horizontal ticker-rule lines animated like live-signal scanlines
 *   - All prefers-reduced-motion safe (animations pause), pointer-events:none
 */
export function NewsFeedBg({ className = "" }: { className?: string }) {
  // Latitude arc centre-y positions (as % of height)
  const latLines  = [15, 30, 45, 60, 75, 88];
  // Longitude arc x-start positions (as % of width)
  const lonLines  = [8, 20, 33, 48, 62, 75, 88];
  // Hotspot positions [cx%, cy%]
  const hotspots: [number, number, number][] = [
    [18,  28, 0],
    [45,  18, 1],
    [70,  42, 2],
    [82,  22, 3],
    [30,  68, 4],
    [60,  72, 5],
    [88,  58, 6],
  ];

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
    >
      <svg
        viewBox="0 0 1000 340"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Scanline ticker gradient */}
          <linearGradient id="nlg-ticker" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#1e3a8a" stopOpacity="0" />
            <stop offset="30%"  stopColor="#1e3a8a" stopOpacity="0.25" />
            <stop offset="70%"  stopColor="#3b82f6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          {/* Radial glow for hotspots */}
          <radialGradient id="nlg-dot" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#60a5fa" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          {/* Subtle right-side ambient glow */}
          <radialGradient id="nlg-ambient" cx="85%" cy="20%" r="50%">
            <stop offset="0%"   stopColor="#1d4ed8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0f172a"  stopOpacity="0" />
          </radialGradient>
          <style>{`
            @media (prefers-reduced-motion: no-preference) {
              .nlg-grid { animation: nlg-drift 28s linear infinite; }
              .nlg-ticker-1 { animation: nlg-slide 7s linear infinite; }
              .nlg-ticker-2 { animation: nlg-slide 11s linear infinite 2s; }
              .nlg-ticker-3 { animation: nlg-slide 9s linear infinite 5s; }
              .nlg-pulse-0 { animation: nlg-pulse 3.8s ease-in-out infinite; }
              .nlg-pulse-1 { animation: nlg-pulse 4.4s ease-in-out infinite 0.6s; }
              .nlg-pulse-2 { animation: nlg-pulse 3.2s ease-in-out infinite 1.2s; }
              .nlg-pulse-3 { animation: nlg-pulse 5.0s ease-in-out infinite 0.3s; }
              .nlg-pulse-4 { animation: nlg-pulse 4.0s ease-in-out infinite 1.8s; }
              .nlg-pulse-5 { animation: nlg-pulse 3.6s ease-in-out infinite 0.9s; }
              .nlg-pulse-6 { animation: nlg-pulse 4.8s ease-in-out infinite 2.4s; }
            }
            @keyframes nlg-drift {
              from { transform: translateX(0); }
              to   { transform: translateX(-6%); }
            }
            @keyframes nlg-slide {
              from { transform: translateX(-110%); }
              to   { transform: translateX(110%); }
            }
            @keyframes nlg-pulse {
              0%,100% { opacity: 0.3; r: 6; }
              50%      { opacity: 0.9; r: 9; }
            }
          `}</style>
        </defs>

        {/* Ambient right-side glow */}
        <rect x="0" y="0" width="1000" height="340" fill="url(#nlg-ambient)" />

        {/* Lat/Lon grid — drifts slowly to imply movement */}
        <g className="nlg-grid" style={{ transformOrigin: "center" }}>
          {/* Latitude lines */}
          {latLines.map((y) => (
            <line
              key={`lat-${y}`}
              x1="-60" y1={`${y}%`} x2="1060" y2={`${y}%`}
              stroke="#93c5fd"
              strokeWidth="0.5"
              strokeOpacity="0.18"
              strokeDasharray="4 8"
            />
          ))}
          {/* Longitude lines */}
          {lonLines.map((x) => (
            <line
              key={`lon-${x}`}
              x1={`${x}%`} y1="0" x2={`${x}%`} y2="340"
              stroke="#93c5fd"
              strokeWidth="0.5"
              strokeOpacity="0.13"
              strokeDasharray="3 9"
            />
          ))}
          {/* Connection edges between select hotspots */}
          <line x1="180" y1="95" x2="450" y2="61"  stroke="#3b82f6" strokeWidth="0.6" strokeOpacity="0.22" />
          <line x1="450" y1="61" x2="700" y2="143" stroke="#3b82f6" strokeWidth="0.6" strokeOpacity="0.18" />
          <line x1="700" y1="143" x2="820" y2="75" stroke="#3b82f6" strokeWidth="0.6" strokeOpacity="0.22" />
          <line x1="180" y1="95" x2="300" y2="231" stroke="#3b82f6" strokeWidth="0.4" strokeOpacity="0.14" />
          <line x1="600" y1="245" x2="880" y2="197" stroke="#3b82f6" strokeWidth="0.4" strokeOpacity="0.14" />
        </g>

        {/* Scanline ticker bars */}
        <g clipPath="none" opacity="1">
          <rect className="nlg-ticker-1" x="0" y="82"  width="340" height="1.5" fill="url(#nlg-ticker)" rx="1" />
          <rect className="nlg-ticker-2" x="0" y="168" width="260" height="1"   fill="url(#nlg-ticker)" rx="1" />
          <rect className="nlg-ticker-3" x="0" y="248" width="310" height="1.5" fill="url(#nlg-ticker)" rx="1" />
        </g>

        {/* Hotspot dots with pulsing rings */}
        {hotspots.map(([cxPct, cyPct, idx]) => {
          const cx = (cxPct / 100) * 1000;
          const cy = (cyPct / 100) * 340;
          return (
            <g key={idx}>
              {/* Outer pulse ring */}
              <circle
                className={`nlg-pulse-${idx}`}
                cx={cx}
                cy={cy}
                r="12"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="0.8"
                strokeOpacity="0.4"
              />
              {/* Glow fill */}
              <circle cx={cx} cy={cy} r="10" fill="url(#nlg-dot)" opacity="0.35" />
              {/* Core dot */}
              <circle
                className={`nlg-pulse-${idx}`}
                cx={cx}
                cy={cy}
                r="4"
                fill="#93c5fd"
                opacity="0.85"
              />
            </g>
          );
        })}
      </svg>
    </span>
  );
}
