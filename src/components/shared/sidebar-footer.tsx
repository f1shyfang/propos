'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { UserDisplay } from '@/lib/user-display';
import { Icon } from './icon';

type SidebarFooterProps = {
  user: UserDisplay;
};

export function SidebarFooter({ user }: SidebarFooterProps) {
  const pathname = usePathname();
  const accountActive = pathname.startsWith('/account');
  const settingsActive = pathname.startsWith('/settings');

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9,
      paddingTop: 14,
      borderTop: '1px solid var(--pg-border)',
    }}>
      <Link
        href="/account"
        aria-current={accountActive ? 'page' : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          flex: 1,
          minWidth: 0,
          textDecoration: 'none',
          color: 'inherit',
          borderRadius: 6,
          margin: '-4px -6px',
          padding: '4px 6px',
          background: accountActive ? 'var(--pg-bg-2)' : 'transparent',
        }}
      >
        <div className="pg-avatar" style={{ background: '#1A1814', color: '#FAFAF7', borderColor: '#1A1814' }}>
          {user.initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500 }} className="pg-truncate">{user.name}</div>
          <div style={{ fontSize: 11, color: 'var(--pg-text-faint)' }} className="pg-truncate">{user.org}</div>
        </div>
      </Link>
      <Link
        href="/settings"
        aria-label="Settings"
        aria-current={settingsActive ? 'page' : undefined}
        className="pg-btn pg-btn-ghost pg-btn-icon pg-btn-sm"
        style={{
          color: settingsActive ? 'var(--pg-text)' : 'var(--pg-text-faint)',
          background: settingsActive ? 'var(--pg-bg-2)' : undefined,
          flexShrink: 0,
        }}
      >
        <Icon name="settings" size={14} />
      </Link>
    </div>
  );
}
