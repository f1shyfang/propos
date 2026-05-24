import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Sidebar } from '@/components/shared/sidebar';
import { QuickFind } from '@/components/shared/quick-find';
import { getUserDisplay } from '@/lib/user-display';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userDisplay = getUserDisplay(null);

  return (
    <NuqsAdapter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--pg-bg)' }}>
        <Sidebar user={userDisplay} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto' }} className="pg-scroll">
          {children}
        </main>
      </div>
      <QuickFind />
    </NuqsAdapter>
  );
}
