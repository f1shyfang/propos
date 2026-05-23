import Link from 'next/link';
import { headers } from 'next/headers';

import { AccountProfileForm } from '@/components/shared/account-profile-form';
import { TopBar } from '@/components/shared/top-bar';
import { Icon } from '@/components/shared/icon';
import { SignOutButton } from '@/components/shared/sign-out-button';
import { auth } from '@/lib/auth';
import { getProfileFields, getUserDisplay } from '@/lib/user-display';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ error?: string; saved?: string }>;

export default async function AccountPage({ searchParams }: { searchParams: SearchParams }) {
  const { error, saved } = await searchParams;
  const sessionData = await auth.api.getSession({ headers: await headers() });
  const user = sessionData?.user ?? null;
  const display = getUserDisplay(user);
  const profile = getProfileFields(user);

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

          <AccountProfileForm
            fullName={profile.fullName}
            organization={profile.organization}
            email={profile.email}
            error={error}
            saved={saved === '1'}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Link href="/settings" className="pg-btn">
            <Icon name="settings" size={13} />
            Settings
          </Link>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
