'use client';

import { Icon } from './icon';
import { Logo } from './logo';
import type { UserDisplay } from '@/lib/user-display';

interface SidebarProps {
  active?: string;
  user?: UserDisplay;
}

const items = [
  { id: 'dashboard', icon: 'home' as const, label: 'Today', href: '/dashboard' },
  { id: 'briefs', icon: 'users' as const, label: 'Briefs', href: '/briefs' },
  { id: 'properties', icon: 'building' as const, label: 'Properties', href: '/properties' },
  { id: 'pipeline', icon: 'pipeline' as const, label: 'Pipeline', href: '/pipeline' },
  { id: 'off-market', icon: 'shield' as const, label: 'Off-Market', href: '/off-market' },
  { id: 'suggestions', icon: 'inbox' as const, label: 'Match Feed', href: '/suggestions' },
  { id: 'docs', icon: 'folder' as const, label: 'Documents', href: '/docs' },
];

export function Sidebar({ active = 'dashboard', user }: SidebarProps) {
  const displayName = user?.name ?? 'Agent';
  const displayOrg = user?.org ?? "Buyer's agency";
  const initials = user?.initials ?? displayName.slice(0, 2).toUpperCase();

  function openQuickFind() {
    window.dispatchEvent(new CustomEvent('quick-find:open'));
  }

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

      <button
        onClick={openQuickFind}
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '8px 10px',
          background: 'transparent',
          border: '1px solid var(--pg-border)',
          borderRadius: 8,
          marginBottom: 16,
          cursor: 'pointer',
          color: 'var(--pg-text-faint)',
          fontSize: 12.5,
          fontFamily: 'var(--pg-font-body)',
          width: '100%',
        }}
      >
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
          </a>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Bottom user section */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9,
        paddingTop: 14,
        borderTop: '1px solid var(--pg-border)',
      }}>
        <div className="pg-avatar" style={{ background: '#1A1814', color: '#FAFAF7', borderColor: '#1A1814', flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
          <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayOrg}</div>
        </div>
        <a
          href="/account"
          title="Account settings"
          style={{ color: 'var(--pg-text-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderRadius: 4, textDecoration: 'none', flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--pg-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--pg-text-faint)')}
        >
          <Icon name="settings" size={14} />
        </a>
      </div>
    </aside>
  );
}
