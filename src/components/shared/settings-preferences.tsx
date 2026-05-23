'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'propos-settings';

type Preferences = {
  emailDigest: boolean;
  matchAlerts: boolean;
  settlementReminders: boolean;
};

const defaults: Preferences = {
  emailDigest: true,
  matchAlerts: true,
  settlementReminders: true,
};

function loadPreferences(): Preferences {
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function SettingsPreferences() {
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefs(loadPreferences());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs, hydrated]);

  function toggle(key: keyof Preferences) {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="pg-card" style={{ padding: '4px 0' }}>
      <PreferenceRow
        label="Daily digest"
        description="Morning summary of new matches and pipeline movement."
        checked={prefs.emailDigest}
        onChange={() => toggle('emailDigest')}
      />
      <div className="pg-divider" />
      <PreferenceRow
        label="Match alerts"
        description="Notify when a property scores above your brief threshold."
        checked={prefs.matchAlerts}
        onChange={() => toggle('matchAlerts')}
      />
      <div className="pg-divider" />
      <PreferenceRow
        label="Settlement reminders"
        description="Remind 24 hours before a scheduled settlement."
        checked={prefs.settlementReminders}
        onChange={() => toggle('settlementReminders')}
      />
    </div>
  );
}

function PreferenceRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '16px 22px',
        cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginTop: 3, lineHeight: 1.45 }}>
          {description}
        </div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ marginTop: 2, accentColor: 'var(--pg-text)' }}
      />
    </label>
  );
}
