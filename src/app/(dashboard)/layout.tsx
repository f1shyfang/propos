import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Sidebar } from '@/components/shared/sidebar';
import { QuickFind } from '@/components/shared/quick-find';
import { createClient } from '@/lib/supabase/server';
import { getUserDisplay } from '@/lib/user-display';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userDisplay = getUserDisplay(user);

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
