interface PropertyThumbProps {
  seed?: number;
  label?: string;
  badge?: React.ReactNode;
  style?: React.CSSProperties;
  height?: number;
  imageUrl?: string | null;
}

const palettes = [
  { sky: '#E8E2D2', mid: '#C9BFAA', accent: '#E5B100', shadow: '#1A1814' },
  { sky: '#DCE3E8', mid: '#B5C0CC', accent: '#2563EB', shadow: '#1A1814' },
  { sky: '#E2DDE8', mid: '#C1BACB', accent: '#6D28D9', shadow: '#1A1814' },
  { sky: '#DCE5DE', mid: '#B3C2B6', accent: '#2F8F4A', shadow: '#1A1814' },
  { sky: '#EBDEC8', mid: '#D7C3A2', accent: '#B96B00', shadow: '#1A1814' },
  { sky: '#E0DBD3', mid: '#BCB5A9', accent: '#E5B100', shadow: '#1A1814' },
];

export function PropertyThumb({ seed = 0, label, badge, style = {}, height = 110, imageUrl }: PropertyThumbProps) {
  if (imageUrl) {
    return (
      <div className="pg-prop-thumb" style={{ height, ...style }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {badge && <div style={{ position: 'absolute', top: 8, left: 8 }}>{badge}</div>}
        {label && (
          <div style={{
            position: 'absolute', bottom: 6, right: 8,
            fontSize: 10, fontFamily: 'var(--pg-font-mono)', color: 'rgba(255,255,255,0.9)',
            background: 'rgba(26,24,20,0.5)', padding: '2px 6px', borderRadius: 4,
          }}>{label}</div>
        )}
      </div>
    );
  }

  const p = palettes[seed % palettes.length];
  const shapes = seed % 4;
  const gradId = `pg-sky-${seed}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <div className="pg-prop-thumb" style={{ height, ...style }}>
      <svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.sky} />
            <stop offset="100%" stopColor={p.mid} />
          </linearGradient>
        </defs>
        <rect width="200" height="110" fill={`url(#${gradId})`} />
        <ellipse cx="20" cy="95" rx="40" ry="14" fill={p.shadow} opacity="0.12" />
        <ellipse cx="185" cy="92" rx="35" ry="12" fill={p.shadow} opacity="0.12" />
        {shapes === 0 && (
          <g>
            <polygon points="50,58 100,32 150,58 150,95 50,95" fill={p.shadow} opacity="0.85" />
            <rect x="70" y="68" width="14" height="12" fill={p.accent} opacity="0.55" />
            <rect x="116" y="68" width="14" height="12" fill={p.accent} opacity="0.35" />
            <rect x="90" y="80" width="16" height="15" fill={p.shadow} />
          </g>
        )}
        {shapes === 1 && (
          <g>
            <rect x="50" y="42" width="100" height="53" fill={p.shadow} opacity="0.85" />
            <rect x="60" y="52" width="20" height="13" fill={p.accent} opacity="0.55" />
            <rect x="90" y="52" width="20" height="13" fill={p.accent} opacity="0.3" />
            <rect x="120" y="52" width="20" height="13" fill={p.accent} opacity="0.5" />
            <rect x="60" y="73" width="20" height="13" fill={p.accent} opacity="0.4" />
            <rect x="120" y="73" width="20" height="13" fill={p.accent} opacity="0.6" />
          </g>
        )}
        {shapes === 2 && (
          <g>
            <polygon points="40,57 100,27 160,57 160,95 40,95" fill={p.shadow} opacity="0.85" />
            <rect x="55" y="67" width="14" height="14" fill={p.accent} opacity="0.5" />
            <rect x="131" y="67" width="14" height="14" fill={p.accent} opacity="0.4" />
            <polygon points="95,80 105,80 105,95 95,95" fill={p.shadow} />
          </g>
        )}
        {shapes === 3 && (
          <g>
            <rect x="60" y="37" width="80" height="58" fill={p.shadow} opacity="0.85" />
            <rect x="60" y="37" width="80" height="3" fill={p.accent} opacity="0.55" />
            <rect x="68" y="50" width="64" height="10" fill={p.accent} opacity="0.45" />
            <rect x="68" y="66" width="30" height="10" fill={p.accent} opacity="0.3" />
            <rect x="102" y="66" width="30" height="10" fill={p.accent} opacity="0.55" />
            <rect x="92" y="82" width="16" height="13" fill={p.shadow} />
          </g>
        )}
      </svg>
      {badge && <div style={{ position: 'absolute', top: 8, left: 8 }}>{badge}</div>}
      {label && (
        <div style={{
          position: 'absolute', bottom: 6, right: 8,
          fontSize: 10, fontFamily: 'var(--pg-font-mono)', color: 'rgba(255,255,255,0.9)',
          background: 'rgba(26,24,20,0.5)', padding: '2px 6px', borderRadius: 4,
        }}>{label}</div>
      )}
    </div>
  );
}
