'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Icon } from './icon';

const items = [
  { id: 'dashboard', icon: 'home' as const, label: 'Today', href: '/dashboard' },
  { id: 'briefs', icon: 'users' as const, label: 'Briefs', href: '/briefs' },
  { id: 'properties', icon: 'building' as const, label: 'Properties', href: '/properties' },
  { id: 'pipeline', icon: 'pipeline' as const, label: 'Pipeline', href: '/pipeline' },
  { id: 'off-market', icon: 'shield' as const, label: 'Off-Market', href: '/off-market' },
  { id: 'suggestions', icon: 'inbox' as const, label: 'Match Feed', count: 3, href: '/suggestions' },
  { id: 'docs', icon: 'folder' as const, label: 'Documents', href: '/docs' },
  { id: 'reports', icon: 'chart' as const, label: 'Reports', href: '/reports' },
];

function activeIdForPath(pathname: string): string {
  if (pathname === '/' || pathname.startsWith('/dashboard')) return 'dashboard';
  for (const item of items) {
    if (item.id !== 'dashboard' && pathname.startsWith(item.href)) return item.id;
  }
  return '';
}

export function SidebarNav() {
  const pathname = usePathname();
  const active = activeIdForPath(pathname);

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {items.map(item => {
        const isActive = active === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 10px',
              borderRadius: 6,
              color: isActive ? 'var(--pg-text)' : 'var(--pg-text-dim)',
              background: isActive ? 'var(--pg-bg-2)' : 'transparent',
              fontSize: 13,
              fontWeight: isActive ? 500 : 400,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <Icon name={item.icon} size={15} color="currentColor" strokeWidth={isActive ? 1.8 : 1.5} />
            <span>{item.label}</span>
            {item.count != null && (
              <span style={{
                marginLeft: 'auto',
                fontSize: 10.5,
                fontFamily: 'var(--pg-font-mono)',
                color: 'var(--pg-text-faint)',
              }}>{item.count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
