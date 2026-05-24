'use client';

import { Icon } from './icon';
import { Logo } from './logo';
import type { UserDisplay } from '@/lib/user-display';
import Link from 'next/link';

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
  { id: 'client-suggestions', icon: 'mail' as const, label: 'Client Suggestions', href: '/client-suggestions' },
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
    <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-[var(--pg-bg)] border-r border-[var(--pg-border)] p-4 h-full">
      <div className="px-1.5 pb-6">
        <Logo />
      </div>

      <button
        onClick={openQuickFind}
        className="flex items-center gap-2 px-2.5 py-2 bg-transparent border border-[var(--pg-border)] rounded-lg mb-4 cursor-pointer text-[var(--pg-text-faint)] text-[12.5px] w-full hover:bg-[var(--pg-bg-2)] hover:text-[var(--pg-text-dim)] transition-colors duration-150 shadow-sm"
      >
        <Icon name="search" size={13} color="currentColor" />
        <span>Quick find</span>
        <span className="ml-auto font-mono text-[10.5px] px-1.5 border border-[var(--pg-border)] rounded shadow-sm bg-white">⌘K</span>
      </button>

      <nav className="flex flex-col gap-0.5">
        {items.map(item => (
          <Link 
            key={item.id} 
            href={item.href} 
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] no-underline cursor-pointer transition-colors duration-150
              ${active === item.id 
                ? 'text-[var(--pg-text)] bg-[var(--pg-bg-2)] font-medium shadow-sm ring-1 ring-[var(--pg-border)]' 
                : 'text-[var(--pg-text-dim)] hover:bg-[var(--pg-bg-offset)] hover:text-[var(--pg-text)] font-normal'}`}
          >
            <Icon name={item.icon} size={15} color="currentColor" strokeWidth={active === item.id ? 1.8 : 1.5} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Bottom user section */}
      <div className="flex items-center gap-2 pt-3.5 mt-2 border-t border-[var(--pg-border)]">
        <div className="pg-avatar bg-[#1A1814] text-[#FAFAF7] border-[#1A1814] flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">{displayName}</div>
          <div className="text-[11px] text-[var(--pg-text-faint)] whitespace-nowrap overflow-hidden text-ellipsis">{displayOrg}</div>
        </div>
        <Link
          href="/account"
          title="Account settings"
          className="text-[var(--pg-text-faint)] hover:text-[var(--pg-text)] hover:bg-[var(--pg-bg-2)] flex items-center justify-center p-1.5 rounded-md no-underline flex-shrink-0 transition-colors duration-150"
        >
          <Icon name="settings" size={14} />
        </Link>
      </div>
    </aside>
  );
}
