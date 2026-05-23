interface SparklineProps {
  data: number[];
  height?: number;
  width?: number;
  color?: string;
  fill?: boolean;
}

export function Sparkline({ data, height = 28, width = 80, color = 'var(--pg-text)', fill = false }: SparklineProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 2) + 1;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as [number, number];
  });
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {fill && <path d={`${path} L${width - 1},${height} L1,${height} Z`} fill={color} opacity={0.08} />}
      <path d={path} stroke={color} strokeWidth={1.3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={1.8} fill={color} />
    </svg>
  );
}
