import Link from 'next/link';

import { TopBar } from '@/components/shared/top-bar';
import { Icon } from '@/components/shared/icon';
import { SettingsPreferences } from '@/components/shared/settings-preferences';

export default function SettingsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar eyebrow="Workspace" title="Settings" />

      <div style={{ padding: '8px 32px 32px', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <SettingsPreferences />

        <div>
          <Link href="/account" className="pg-btn pg-btn-ghost" style={{ paddingLeft: 0 }}>
            <Icon name="users" size={13} />
            Manage account
          </Link>
        </div>
      </div>
    </div>
  );
}
