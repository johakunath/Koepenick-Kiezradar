interface RelevanceWavesProps {
  score: number;
}

export default function RelevanceWaves({ score }: RelevanceWavesProps) {
  const active = Math.max(1, Math.ceil(score * 5));
  // Heights grow with each bar: 5, 7, 9, 11, 13px
  const heights = [5, 7, 9, 11, 13];
  const maxH = 14;

  return (
    <div
      style={{ display: "flex", alignItems: "flex-end", gap: 2 }}
      title={`${Math.round(score * 100)} % lokale Relevanz`}
    >
      {heights.map((h, i) => {
        const yTop = maxH - h;
        const yCrest = yTop - 2;
        const fill = i < active ? "var(--water-mid)" : "var(--border)";
        const opacity = i < active ? 0.5 + i * 0.12 : 1;
        return (
          <svg key={i} width="8" height={maxH} viewBox={`0 0 8 ${maxH}`} fill="none">
            <path
              d={`M0 ${yTop} Q 2 ${yCrest} 4 ${yTop} T 8 ${yTop} L 8 ${maxH} L 0 ${maxH} Z`}
              fill={fill}
              opacity={opacity}
            />
          </svg>
        );
      })}
    </div>
  );
}
