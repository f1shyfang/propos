import { Icon } from '@/components/shared/icon';
import { PortalNav } from '@/components/portal/portal-nav';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pg" style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--pg-bg)' }}>
      <header className="pg-glass" style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '18px 32px',
        borderBottom: '1px solid var(--pg-border)',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        {/* Agent brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#1A1814', color: '#FAFAF7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--pg-font-display)', fontWeight: 600, fontSize: 16,
          }}>B</div>
          <div>
            <div style={{ fontFamily: 'var(--pg-font-display)', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Bayside Buyer&apos;s</div>
            <div style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>Your private property dashboard</div>
          </div>
        </div>

        {/* Tabs */}
        <PortalNav />

        <div style={{ flex: 1 }} />

        <button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ color: 'var(--pg-text-dim)' }}>
          <Icon name="bell" size={13} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div className="pg-avatar pg-avatar-sm" style={{ background: '#E5B100', color: '#1A1814', border: 'none' }}>SC</div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>Sarah Chen</div>
            <div style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>+ Tom Chen</div>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, overflow: 'auto' }} className="pg-scroll">
        {children}
      </main>
    </div>
  );
}
