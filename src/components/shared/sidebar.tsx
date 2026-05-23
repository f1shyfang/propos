import { Icon } from './icon';
import { Logo } from './logo';
import { SidebarNav } from './sidebar-nav';
import { SidebarUser } from './sidebar-user';

export function Sidebar() {
  return (
    <aside style={{
      width: 220,
      flex: '0 0 220px',
      background: 'var(--pg-bg)',
      borderRight: '1px solid var(--pg-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '18px 14px',
      height: '100%',
    }}>
      <div style={{ padding: '2px 6px 22px' }}>
        <Logo />
      </div>

      <button style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 10px',
        background: 'transparent',
        border: '1px solid var(--pg-border)',
        borderRadius: 8,
        marginBottom: 16,
        cursor: 'text',
        color: 'var(--pg-text-faint)',
        fontSize: 12.5,
        fontFamily: 'var(--pg-font-body)',
        width: '100%',
      }}>
        <Icon name="search" size={13} color="currentColor" />
        <span>Quick find</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--pg-font-mono)', fontSize: 10.5, padding: '0 5px', border: '1px solid var(--pg-border)', borderRadius: 3 }}>⌘K</span>
      </button>

      <SidebarNav />

      <div style={{ flex: 1 }} />

      <div style={{ padding: 12, background: 'var(--pg-bg-2)', borderRadius: 8, marginBottom: 14 }}>
        <div className="pg-label" style={{ fontSize: 9.5, marginBottom: 4 }}>Settling Today</div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>22 Oak Ave, Kew</div>
        <div style={{ fontSize: 11, color: 'var(--pg-text-dim)', marginTop: 2 }}>Cho · $1.62M · 2pm</div>
      </div>

      <SidebarUser />
    </aside>
  );
}
