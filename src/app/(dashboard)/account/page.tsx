import Link from 'next/link';

import { TopBar } from '@/components/shared/top-bar';
import { Icon } from '@/components/shared/icon';
import { createClient } from '@/lib/supabase/server';
import { getUserDisplay } from '@/lib/user-display';
import { signOut } from '@/app/login/actions';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const display = getUserDisplay(user);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar eyebrow="Workspace" title="Account" />

      <div style={{ padding: '8px 32px 32px', maxWidth: 560 }}>
        <div className="pg-card" style={{ padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div
              className="pg-avatar pg-avatar-lg"
              style={{ background: '#1A1814', color: '#FAFAF7', borderColor: '#1A1814' }}
            >
              {display.initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{display.name}</div>
              <div style={{ fontSize: 13, color: 'var(--pg-text-dim)', marginTop: 2 }}>{display.org}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Email" value={display.email || '—'} />
            <Field label="Role" value="Buyer's agent" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Link href="/settings" className="pg-btn">
            <Icon name="settings" size={13} />
            Settings
          </Link>
          <form action={signOut}>
            <button type="submit" className="pg-btn">
              <Icon name="logout" size={13} />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="pg-label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 13.5 }}>{value}</div>
    </div>
  );
}
