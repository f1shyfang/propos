import { headers } from 'next/headers';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Sidebar } from '@/components/shared/sidebar';
import { QuickFind } from '@/components/shared/quick-find';
import { auth } from '@/lib/auth';
import { getUserDisplay } from '@/lib/user-display';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sessionData = await auth.api.getSession({ headers: await headers() });
  const userDisplay = getUserDisplay(sessionData?.user ?? null);

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
