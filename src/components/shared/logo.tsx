export function Logo({ size = 22 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#1A1814" />
        <circle cx="12" cy="12" r="7" stroke="#E5B100" strokeWidth="1.4" fill="none" />
        <path d="M12 7v5l3 2" stroke="#E5B100" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span style={{ fontFamily: 'var(--pg-font-display)', fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--pg-text)' }}>
        Propertygo
      </span>
    </div>
  );
}
