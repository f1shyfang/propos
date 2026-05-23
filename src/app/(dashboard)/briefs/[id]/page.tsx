'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@/components/shared/icon';
import { MatchScore } from '@/components/shared/match-score';
import { PropertyThumb } from '@/components/shared/property-thumb';

interface BriefMatch {
  id: string; address: string; suburb: string | null; state: string | null;
  price: string; propertyType: string | null; bedrooms: number | null;
  bathrooms: number | null; parkingSpaces: number | null; days: number | null;
  score: number; overallScore: number; underOffer: boolean; href: string;
}

interface ShortlistItem {
  shortlistId: number; status: string; feedbackStatus: string;
  feedbackText: string | null; agentNote: string | null;
  property: { id: string; address: string; suburb: string | null; price: string; score: number } | null;
}

interface Brief {
  id: number; clientName: string; email: string; budgetMin: number | null;
  budgetMax: number | null; suburbs: string[]; propertyTypes: string[];
  mustHaves: string[]; dealBreakers: string[]; minBeds: number | null;
  minBaths: number | null; status: string | null;
}

type Tab = 'matches' | 'shortlist';

export default function BriefDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('matches');
  const [data, setData] = useState<{ brief: Brief; matches: BriefMatch[]; shortlist: ShortlistItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [shortlisting, setShortlisting] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/briefs/${id}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function toggleShortlist(propertyId: string) {
    setShortlisting(propertyId);
    await fetch('/api/shortlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId: id, propertyId }),
    });
    await load();
    setShortlisting(null);
  }

  function toggleCompare(propertyId: string) {
    setCompareIds(ids =>
      ids.includes(propertyId)
        ? ids.filter(x => x !== propertyId)
        : ids.length < 3 ? [...ids, propertyId] : ids
    );
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--pg-text-dim)' }}>Loading…</div>;
  if (!data) return <div style={{ padding: 40, color: 'var(--pg-red)' }}>Brief not found.</div>;

  const { brief, matches, shortlist } = data;
  const shortlistedIds = new Set(shortlist.map(s => s.property?.id).filter(Boolean));
  const fmt = (n: number | null) => n ? (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`) : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 32px 0', borderBottom: '1px solid var(--pg-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <a href="/briefs" style={{ color: 'var(--pg-text-faint)', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="chevron-left" size={11} />Briefs
          </a>
          <span className={`pg-badge ${brief.status === 'searching' ? 'pg-badge-green pg-badge-dot' : ''}`} style={{ fontSize: 11 }}>
            {brief.status ?? 'searching'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, paddingBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <h1 className="pg-display" style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>{brief.clientName}</h1>
            <div style={{ fontSize: 13, color: 'var(--pg-text-dim)', marginTop: 4 }}>
              {brief.email} · Budget {fmt(brief.budgetMin)} – {fmt(brief.budgetMax)}
              {brief.suburbs?.length ? ` · ${brief.suburbs.slice(0, 3).join(', ')}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {compareIds.length >= 2 && (
              <a href={`/properties/compare?ids=${compareIds.join(',')}`}
                className="pg-btn pg-btn-accent">
                <Icon name="grid" size={13} />Compare {compareIds.length}
              </a>
            )}
            <a href={`/briefs/${id}/edit`} className="pg-btn"><Icon name="pen" size={13} />Edit brief</a>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {([['matches', `${matches.length} matches`], ['shortlist', `${shortlist.length} shortlisted`]] as [Tab, string][]).map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', padding: '10px 16px 12px', fontSize: 13,
              fontWeight: tab === t ? 500 : 400,
              color: tab === t ? 'var(--pg-text)' : 'var(--pg-text-dim)',
              cursor: 'pointer', borderBottom: tab === t ? '2px solid var(--pg-text)' : '2px solid transparent',
              marginBottom: -1, fontFamily: 'var(--pg-font-body)',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }} className="pg-scroll">
        {tab === 'matches' && (
          <>
            {matches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--pg-text-dim)' }}>
                <Icon name="building" size={36} color="var(--pg-text-very-faint)" />
                <div style={{ fontSize: 15, marginTop: 14, fontWeight: 500 }}>No matches yet</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Add suburbs and property types to the brief to see matched properties.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }} className="pg-card-flat">
                {matches.map((m, i, a) => {
                  const inShortlist = shortlistedIds.has(m.id);
                  const inCompare = compareIds.includes(m.id);
                  return (
                    <div key={m.id} className="pg-row" style={{
                      display: 'grid', gridTemplateColumns: '28px 2.4fr 0.8fr 0.7fr 0.7fr 0.7fr 0.7fr',
                      padding: '12px 16px', alignItems: 'center', fontSize: 13,
                      borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none',
                      gap: 12,
                    }}>
                      <input type="checkbox" checked={inCompare} onChange={() => toggleCompare(m.id)}
                        disabled={!inCompare && compareIds.length >= 3}
                        title={!inCompare && compareIds.length >= 3 ? 'Max 3 for comparison' : 'Compare'}
                        style={{ accentColor: 'var(--pg-accent)', cursor: 'pointer' }} />
                      <a href={m.href} style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
                        <PropertyThumb seed={i % 6} height={38} style={{ width: 56, flexShrink: 0, borderRadius: 5 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 500, fontSize: 13 }} className="pg-truncate">{m.address}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--pg-text-dim)' }}>{m.suburb}, {m.state}</div>
                        </div>
                      </a>
                      <div><MatchScore score={m.score} size={30} stroke={3} /></div>
                      <div className="pg-mono" style={{ fontSize: 12 }}>{m.price}</div>
                      <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>
                        {m.bedrooms ?? '—'}/{m.bathrooms ?? '—'}/{m.parkingSpaces ?? '—'}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--pg-text-faint)' }}>
                        {m.propertyType ?? '—'}
                      </div>
                      <button
                        onClick={() => toggleShortlist(m.id)}
                        disabled={shortlisting === m.id}
                        className={`pg-btn pg-btn-sm ${inShortlist ? 'pg-btn-accent' : ''}`}
                        style={{ justifyContent: 'center', whiteSpace: 'nowrap' }}
                      >
                        <Icon name="bookmark" size={11} />
                        {inShortlist ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'shortlist' && (
          <>
            {shortlist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--pg-text-dim)' }}>
                <Icon name="bookmark" size={36} color="var(--pg-text-very-faint)" />
                <div style={{ fontSize: 15, marginTop: 14, fontWeight: 500 }}>No shortlisted properties</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Save properties from the Matches tab to build the shortlist.</div>
              </div>
            ) : (
              <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
                {shortlist.map((s, i, a) => {
                  const p = s.property;
                  if (!p) return null;
                  const statusColors: Record<string, string> = {
                    interested: 'pg-badge-green', need_more_info: 'pg-badge-amber',
                    not_for_me: 'pg-badge-red', new: '', viewed: '',
                  };
                  return (
                    <div key={s.shortlistId} style={{
                      display: 'grid', gridTemplateColumns: '2.5fr 0.8fr 0.8fr 1fr',
                      padding: '14px 16px', alignItems: 'center', fontSize: 13,
                      borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none',
                      gap: 16,
                    }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{p.address}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--pg-text-dim)' }}>{p.suburb}</div>
                        {s.feedbackText && (
                          <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginTop: 4, fontStyle: 'italic' }}>
                            &ldquo;{s.feedbackText}&rdquo;
                          </div>
                        )}
                      </div>
                      <div className="pg-mono" style={{ fontSize: 12 }}>{p.price}</div>
                      <div>
                        <span className={`pg-badge ${statusColors[s.feedbackStatus] ?? ''}`} style={{ fontSize: 11 }}>
                          {s.feedbackStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <a href={`/properties/${p.id}`} className="pg-btn pg-btn-sm">View</a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
