// SVG Pegellatte — horizontal water-level rod with pennant marker.

interface PegelProps {
  score: number; // 0..1
}

export default function Pegel({ score }: PegelProps) {
  const W = 38;
  const mid = 9;
  const x = Math.max(2, Math.min(W, W * score));
  const pct = Math.round(score * 100);

  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
      aria-label={`Pegel ${pct}`}
    >
      <svg width={W} height="14" viewBox={`0 0 ${W} 14`} style={{ display: "block" }}>
        {/* rod */}
        <line x1="0" y1={mid} x2={W} y2={mid} stroke="var(--rule)" strokeWidth="1.4" />
        {/* end caps */}
        <line x1="0" y1={mid - 3} x2="0" y2={mid + 3} stroke="var(--rule)" strokeWidth="1.2" />
        <line x1={W / 2} y1={mid - 2} x2={W / 2} y2={mid + 2} stroke="var(--rule)" strokeWidth="1" opacity="0.7" />
        <line x1={W} y1={mid - 3} x2={W} y2={mid + 3} stroke="var(--rule)" strokeWidth="1.2" />
        {/* water level */}
        <line x1="0" y1={mid} x2={x} y2={mid} stroke="var(--water-2)" strokeWidth="2.8" strokeLinecap="round" />
        {/* pennant */}
        <path d={`M${x - 3} 1 L ${x + 3} 1 L ${x} ${mid - 1.5} Z`} fill="var(--water)" />
      </svg>
      <span
        style={{
          fontFamily: "var(--font-inter-tight)",
          fontSize: 11.5,
          fontWeight: 500,
          color: "var(--ink-soft)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {pct}
      </span>
    </span>
  );
}
