import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Sidebar } from '@/components/shared/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--pg-bg)' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto' }} className="pg-scroll">
          {children}
        </main>
      </div>
    </NuqsAdapter>
  );
}
