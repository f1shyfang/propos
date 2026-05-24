'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from './icon';
import { filterQuickFindResults, type QuickFindItem } from '@/lib/quick-find-utils';

const TYPE_ICONS: Record<string, 'building' | 'users' | 'briefcase'> = {
  property: 'building',
  brief: 'users',
  deal: 'briefcase',
};

const TYPE_LABELS: Record<string, string> = {
  property: 'Property',
  brief: 'Client',
  deal: 'Deal',
};

export function QuickFind() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [allItems, setAllItems] = useState<QuickFindItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = filterQuickFindResults(query, allItems);

  const openModal = useCallback(() => {
    setOpen(true);
    setQuery('');
    setActive(0);
  }, []);

  // ⌘K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openModal();
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openModal]);

  // Custom event from sidebar button
  useEffect(() => {
    function onOpen() { openModal(); }
    window.addEventListener('quick-find:open', onOpen);
    return () => window.removeEventListener('quick-find:open', onOpen);
  }, [openModal]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  // Fetch items once on open
  useEffect(() => {
    if (!open || allItems.length > 0) return;
    setLoading(true);
    fetch('/api/quick-find')
      .then(r => r.json())
      .then(d => setAllItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, [open, allItems.length]);

  // Debounce fetch when query changes (only if we need more results)
  useEffect(() => {
    if (!open || !query.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/quick-find?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(d => setAllItems(prev => {
          // Merge new items, dedupe by id
          const map = new Map(prev.map(i => [i.id, i]));
          (d.items ?? []).forEach((i: QuickFindItem) => map.set(i.id, i));
          return [...map.values()];
        }));
    }, 250);
  }, [query, open]);

  useEffect(() => { setActive(0); }, [query]);

  function navigate(href: string) {
    setOpen(false);
    window.location.href = href;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filtered[active]) navigate(filtered[active].href);
  }

  const grouped = filtered.reduce<Record<string, QuickFindItem[]>>((acc, item) => {
    (acc[item.type] ??= []).push(item);
    return acc;
  }, {});

  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 120, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{ width: 560, maxWidth: '90vw', background: 'var(--pg-bg)', border: '1px solid var(--pg-border)', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.22)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--pg-border)' }}>
          <Icon name="search" size={15} color="var(--pg-text-faint)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search properties, clients, deals…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--pg-text)', fontFamily: 'var(--pg-font-body)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--pg-text-faint)' }}>
              <Icon name="x" size={13} />
            </button>
          )}
          <kbd style={{ fontSize: 10.5, fontFamily: 'var(--pg-font-mono)', padding: '2px 5px', border: '1px solid var(--pg-border)', borderRadius: 4, color: 'var(--pg-text-faint)' }}>Esc</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflow: 'auto' }} className="pg-scroll">
          {loading && (
            <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--pg-text-faint)', textAlign: 'center' }}>Loading…</div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: '24px 16px', fontSize: 13, color: 'var(--pg-text-faint)', textAlign: 'center' }}>
              {query ? `No results for "${query}"` : 'Start typing to search…'}
            </div>
          )}

          {!loading && Object.entries(grouped).map(([type, groupItems]) => {
            let globalIdx = filtered.indexOf(groupItems[0]);
            return (
              <div key={type}>
                <div style={{ padding: '8px 16px 4px', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--pg-text-faint)' }}>
                  {TYPE_LABELS[type] ?? type}
                </div>
                {groupItems.map((item) => {
                  const idx = filtered.indexOf(item);
                  const isActive = idx === active;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setActive(idx)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                        padding: '9px 16px', border: 'none', textAlign: 'left', cursor: 'pointer',
                        background: isActive ? 'var(--pg-accent-soft)' : 'transparent',
                        borderLeft: `2px solid ${isActive ? 'var(--pg-accent)' : 'transparent'}`,
                        transition: 'background 80ms',
                        fontFamily: 'var(--pg-font-body)',
                      }}
                    >
                      <Icon name={TYPE_ICONS[item.type] ?? 'file'} size={14} color={isActive ? 'var(--pg-accent)' : 'var(--pg-text-faint)'} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pg-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                        {item.sublabel && (
                          <div style={{ fontSize: 11.5, color: 'var(--pg-text-faint)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.sublabel}</div>
                        )}
                      </div>
                      {isActive && <Icon name="arrow-right" size={12} color="var(--pg-accent)" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--pg-border)', display: 'flex', gap: 16, alignItems: 'center' }}>
          {[['↑↓', 'Navigate'], ['↵', 'Open'], ['Esc', 'Close']].map(([key, label]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--pg-text-faint)' }}>
              <kbd style={{ fontFamily: 'var(--pg-font-mono)', fontSize: 10, padding: '1px 4px', border: '1px solid var(--pg-border)', borderRadius: 3 }}>{key}</kbd>
              {label}
            </span>
          ))}
          <div style={{ flex: 1 }} />
          {filtered.length > 0 && (
            <span style={{ fontSize: 11, fontFamily: 'var(--pg-font-mono)', color: 'var(--pg-text-faint)' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}
