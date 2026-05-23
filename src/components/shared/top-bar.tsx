interface TopBarProps {
  title?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, eyebrow, actions }: TopBarProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '20px 32px 18px',
    }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', letterSpacing: '0.04em', marginBottom: 3 }}>{eyebrow}</div>}
        {title && <h1 className="pg-display" style={{ margin: 0, fontSize: 26, fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '-0.025em' }}>{title}</h1>}
      </div>
      <div style={{ flex: 1 }} />
      {actions}
    </div>
  );
}
