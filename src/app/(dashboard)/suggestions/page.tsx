'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/shared/top-bar';
import { formatPrice } from '@/lib/utils';
import type { MatchFeedItem } from '@/lib/match-feed-utils';

interface Brief { id: number; clientName: string }

function ScoreRing({ score }: { score: number }) {
  const r = 11, stroke = 2.5, circ = 2 * Math.PI * r;
  const color = score >= 80 ? 'var(--pg-green)' : score >= 60 ? 'var(--pg-amber)' : 'var(--pg-text-faint)';
  return (
    <svg width={28} height={28} viewBox="0 0 28 28" style={{ flexShrink: 0 }}>
      <circle cx={14} cy={14} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
      <circle cx={14} cy={14} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round" transform="rotate(-90 14 14)" />
      <text x={14} y={18} textAnchor="middle" fontSize={8} fontWeight={600} fill={color}>{score}</text>
    </svg>
  );
}

export default function MatchFeedPage() {
  const [items, setItems] = useState<MatchFeedItem[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBriefId, setSelectedBriefId] = useState<number | null>(null);

  async function load(briefId: number | null) {
    setLoading(true);
    const url = briefId ? `/api/suggestions?briefId=${briefId}` : '/api/suggestions';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
      if (!briefId) setBriefs(data.briefs ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(null); }, []);

  function handleBriefChange(id: number | null) {
    setSelectedBriefId(id);
    load(id);
  }

  const scoreGroups = {
    strong: items.filter(i => i.score >= 80),
    good: items.filter(i => i.score >= 60 && i.score < 80),
    partial: items.filter(i => i.score < 60),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar
      eyebrow={loading ? 'Loading…' : `${items.length} matches across ${selectedBriefId ? '1 client' : `${briefs.length} clients`}`}
        title="Match Feed"
        actions={
          <>
            <select
              value={selectedBriefId ?? ''}
              onChange={e => handleBriefChange(e.target.value ? Number(e.target.value) : null)}
              style={{ padding: '6px 10px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 12 }}
            >
              <option value="">All clients</option>
              {briefs.map(b => (
                <option key={b.id} value={b.id}>{b.clientName}</option>
              ))}
            </select>
            <button className="pg-btn" onClick={() => load(selectedBriefId)}>
              Refresh
            </button>
          </>
        }
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '0 32px 32px' }} className="pg-scroll">
        {loading && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--pg-text-faint)', fontSize: 13 }}>
            Computing matches…
          </div>
        )}

        {!loading && items.length === 0 && (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--pg-text-dim)', marginBottom: 6 }}>No matches found</div>
              <div style={{ fontSize: 12, color: 'var(--pg-text-faint)' }}>
              Add clients with suburbs and property types to see matches here.
            </div>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingTop: 24 }}>
            {(Object.entries(scoreGroups) as [string, MatchFeedItem[]][])
              .filter(([, list]) => list.length > 0)
              .map(([group, list]) => (
                <section key={group}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: group === 'strong' ? 'var(--pg-green)' : group === 'good' ? 'var(--pg-amber)' : 'var(--pg-text-faint)' }} />
                    <h2 style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--pg-text-dim)' }}>
                      {group === 'strong' ? 'Strong match (80+)' : group === 'good' ? 'Good match (60–79)' : 'Partial match (<60)'}
                    </h2>
                    <span style={{ fontSize: 11, fontFamily: 'var(--pg-font-mono)', color: 'var(--pg-text-faint)' }}>{list.length}</span>
                  </div>

                  <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.7fr 0.8fr 0.8fr 0.6fr', padding: '9px 16px', borderBottom: '1px solid var(--pg-border)', fontSize: 10.5, color: 'var(--pg-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                      <span>Property</span><span>Client</span><span style={{ textAlign: 'right' }}>Price</span><span style={{ textAlign: 'center' }}>Score</span><span style={{ textAlign: 'center' }}>Beds / Bath</span><span style={{ textAlign: 'right' }}>Days</span>
                    </div>
                    {list.map((item, i, a) => (
                      <a key={`${item.briefId}-${item.propertyId}`} href={`/properties/${item.propertyId}`}
                        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.7fr 0.8fr 0.8fr 0.6fr', padding: '12px 16px', borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none', fontSize: 13, alignItems: 'center', textDecoration: 'none', color: 'inherit', transition: 'background 80ms' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--pg-surface)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.address}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--pg-text-faint)', marginTop: 1 }}>{item.suburb}{item.state ? `, ${item.state}` : ''} · {item.propertyType ?? '—'}</div>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.briefClientName}
                        </div>
                        <div style={{ fontFamily: 'var(--pg-font-mono)', fontSize: 12, fontWeight: 500, textAlign: 'right' }}>
                          {formatPrice(item.price, item.priceDisplay)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <ScoreRing score={item.score} />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', textAlign: 'center' }}>
                          {item.bedrooms ?? '—'} / {item.bathrooms ?? '—'}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--pg-text-faint)', textAlign: 'right' }}>
                          {item.days != null ? `${item.days}d` : '—'}
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
