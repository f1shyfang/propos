'use client';

import { Icon } from '@/components/shared/icon';

/** Table = dense list. Split = list + map side-by-side (like properties). */
export type ViewMode = 'table' | 'split';

export function ViewToggle({ value, onChange }: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="View mode"
      style={{
        display: 'inline-flex',
        border: '1px solid var(--pg-border-strong)',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--pg-surface)',
      }}
    >
      {([
        ['table', 'list', 'Table view'] as const,
        ['split', 'map', 'Map view'] as const,
      ]).map(([mode, icon, label]) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={active}
            title={label}
            onClick={() => onChange(mode)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '7px 12px',
              border: 'none',
              background: active ? 'var(--pg-accent-soft)' : 'transparent',
              color: active ? '#806000' : 'var(--pg-text-dim)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: active ? 500 : 400,
              fontFamily: 'var(--pg-font-body)',
              borderRight: mode === 'table' ? '1px solid var(--pg-border)' : 'none',
            }}
          >
            <Icon name={icon} size={13} strokeWidth={active ? 2.2 : 2} />
            {mode === 'table' ? 'List' : 'Map'}
          </button>
        );
      })}
    </div>
  );
}
