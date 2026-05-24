export function InlineAlert({
  variant,
  children,
}: {
  variant: 'success' | 'error';
  children: React.ReactNode;
}) {
  const color = variant === 'error' ? 'var(--pg-red)' : 'var(--pg-green)';
  return (
    <p style={{ fontSize: 11, margin: '8px 0 0', color }}>
      {children}
    </p>
  );
}
