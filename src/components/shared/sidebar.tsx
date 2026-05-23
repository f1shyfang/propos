import { Icon } from './icon';
import { Logo } from './logo';

interface SidebarProps {
  active?: string;
}

const items = [
  { id: 'dashboard', icon: 'home' as const, label: 'Today', href: '/' },
  { id: 'clients', icon: 'users' as const, label: 'Clients', count: 23, href: '/clients' },
  { id: 'properties', icon: 'building' as const, label: 'Properties', href: '/properties' },
  { id: 'deals', icon: 'pipeline' as const, label: 'Pipeline', count: 14, href: '/pipeline' },
  { id: 'suggestions', icon: 'inbox' as const, label: 'Suggestions', count: 3, href: '/suggestions' },
  { id: 'docs', icon: 'folder' as const, label: 'Documents', href: '/docs' },
  { id: 'reports', icon: 'chart' as const, label: 'Reports', href: '/reports' },
];

export function Sidebar({ active = 'dashboard' }: SidebarProps) {
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

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map(item => (
          <a key={item.id} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 10px',
            borderRadius: 6,
            color: active === item.id ? 'var(--pg-text)' : 'var(--pg-text-dim)',
            background: active === item.id ? 'var(--pg-bg-2)' : 'transparent',
            fontSize: 13,
            fontWeight: active === item.id ? 500 : 400,
            textDecoration: 'none',
            cursor: 'pointer',
          }}>
            <Icon name={item.icon} size={15} color="currentColor" strokeWidth={active === item.id ? 1.8 : 1.5} />
            <span>{item.label}</span>
            {item.count != null && (
              <span style={{
                marginLeft: 'auto',
                fontSize: 10.5,
                fontFamily: 'var(--pg-font-mono)',
                color: 'var(--pg-text-faint)',
              }}>{item.count}</span>
            )}
          </a>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      <div style={{ padding: 12, background: 'var(--pg-bg-2)', borderRadius: 8, marginBottom: 14 }}>
        <div className="pg-label" style={{ fontSize: 9.5, marginBottom: 4 }}>Settling Today</div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>22 Oak Ave, Kew</div>
        <div style={{ fontSize: 11, color: 'var(--pg-text-dim)', marginTop: 2 }}>Cho · $1.62M · 2pm</div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 9,
        paddingTop: 14,
        borderTop: '1px solid var(--pg-border)',
      }}>
        <div className="pg-avatar" style={{ background: '#1A1814', color: '#FAFAF7', borderColor: '#1A1814' }}>JM</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500 }}>Jess Morgan</div>
          <div style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>Bayside Buyer&apos;s</div>
        </div>
        <button className="pg-btn pg-btn-ghost pg-btn-icon pg-btn-sm" style={{ color: 'var(--pg-text-faint)' }}>
          <Icon name="settings" size={14} />
        </button>
      </div>
    </aside>
  );
}
