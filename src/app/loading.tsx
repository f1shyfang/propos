export default function Loading() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--pg-bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="pg-spinner" style={{ width: 32, height: 32, border: '3px solid var(--pg-border)', borderTopColor: 'var(--pg-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: 'var(--pg-text-dim)', fontSize: 14 }}>Loading...</div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      ` }} />
    </div>
  );
}
