'use client';

import { usePathname } from 'next/navigation';

import { PortalHeader } from '@/components/portal/portal-header';

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/portal/login';

  return (
    <div className="pg" style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--pg-bg)' }}>
      {!isLogin && <PortalHeader />}
      <main style={{ flex: 1, overflow: 'auto' }} className="pg-scroll">
        {children}
      </main>
    </div>
  );
}
