interface MatchScoreProps {
  score: number;
  size?: number;
  stroke?: number;
}

export function MatchScore({ score = 80, size = 32, stroke = 3 }: MatchScoreProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  const color = score >= 80 ? 'var(--pg-green)' : score >= 65 ? 'var(--pg-accent)' : 'var(--pg-red, #ef4444)';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(20,18,12,0.08)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" fill="none" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size > 40 ? 13 : 10.5, fontWeight: 600,
        fontFamily: 'var(--pg-font-mono)', color,
      }}>{score}</div>
    </div>
  );
}
