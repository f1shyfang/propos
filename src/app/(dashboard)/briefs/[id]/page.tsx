'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { Icon } from '@/components/shared/icon';
import { MatchScore } from '@/components/shared/match-score';
import { PropertyThumb } from '@/components/shared/property-thumb';
import { generateDefaultRoadmap, calcRoadmapDates, type RoadmapMilestone } from '@/lib/roadmap-utils';

interface BriefMatch {
  id: string; address: string; suburb: string | null; state: string | null;
  price: string; propertyType: string | null; bedrooms: number | null;
  bathrooms: number | null; parkingSpaces: number | null; days: number | null;
  score: number; overallScore: number; underOffer: boolean; imageUrl: string | null; href: string;
}

interface ShortlistItem {
  shortlistId: number; status: string; feedbackStatus: string;
  feedbackText: string | null; feedbackReason: string | null; feedbackAt: string | null; agentNote: string | null; sharedAt: string | null;
  property: { id: string; address: string; suburb: string | null; price: string; score: number; imageUrl?: string | null } | null;
}

interface Brief {
  id: number; clientName: string; email: string; phone: string; clientUserId: string | null;
  contactMethod: string | null; engagementType: string | null; preApprovalStatus: string | null;
  buyerType: string | null; urgency: string | null; purchasePurpose: string | null;
  auctionWillingness: boolean | null;
  budgetMin: number | null; budgetMax: number | null; suburbs: string[];
  propertyTypes: string[]; mustHaves: string[]; dealBreakers: string[];
  minBeds: number | null; minBaths: number | null; parking: string | null; status: string | null;
}

interface FilterState {
  // Contact
  clientName: string; email: string; phone: string;
  contactMethod: string; engagementType: string; preApprovalStatus: string;
  buyerType: string; urgency: string; purchasePurpose: string;
  auctionWillingness: boolean; status: string;
  // Search criteria
  budgetMin: string; budgetMax: string;
  minBeds: string; minBaths: string;
  parking: string;
  suburbs: string;
  propertyTypes: string;
  mustHaves: string;
  dealBreakers: string;
}

function briefToFilter(b: Brief): FilterState {
  return {
    clientName: b.clientName ?? '',
    email: b.email ?? '',
    phone: b.phone ?? '',
    contactMethod: b.contactMethod ?? 'email',
    engagementType: b.engagementType ?? 'full-service',
    preApprovalStatus: b.preApprovalStatus ?? 'Not Started',
    buyerType: b.buyerType ?? 'owner-occupier',
    urgency: b.urgency ?? '3 months',
    purchasePurpose: b.purchasePurpose ?? 'PPOR',
    auctionWillingness: b.auctionWillingness ?? true,
    status: b.status ?? 'searching',
    budgetMin: b.budgetMin ? String(b.budgetMin) : '',
    budgetMax: b.budgetMax ? String(b.budgetMax) : '',
    minBeds: b.minBeds ? String(b.minBeds) : '0',
    minBaths: b.minBaths ? String(b.minBaths) : '0',
    parking: b.parking ?? 'nice_to_have',
    suburbs: (b.suburbs ?? []).join(', '),
    propertyTypes: (b.propertyTypes ?? []).join(', '),
    mustHaves: (b.mustHaves ?? []).join(', '),
    dealBreakers: (b.dealBreakers ?? []).join(', '),
  };
}

function filterToParams(f: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.budgetMin) p.set('budgetMin', f.budgetMin);
  if (f.budgetMax) p.set('budgetMax', f.budgetMax);
  if (f.minBeds) p.set('minBeds', f.minBeds);
  if (f.minBaths) p.set('minBaths', f.minBaths);
  if (f.parking) p.set('parking', f.parking);
  const suburbs = f.suburbs.split(',').map(s => s.trim()).filter(Boolean);
  if (suburbs.length) p.set('suburbs', suburbs.join(','));
  const types = f.propertyTypes.split(',').map(s => s.trim()).filter(Boolean);
  if (types.length) p.set('propertyTypes', types.join(','));
  return p;
}

type Tab = 'matches' | 'shortlist' | 'roadmap' | 'profile';

export default function BriefDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useQueryState<Tab>('tab', { defaultValue: 'matches', parse: (v) => ((['matches','shortlist','roadmap','profile'] as const).includes(v as Tab) ? v as Tab : 'matches'), shallow: true });
  const [brief, setBrief] = useState<Brief | null>(null);
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [matches, setMatches] = useState<BriefMatch[]>([]);
  const [matchTotal, setMatchTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [shortlisting, setShortlisting] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapMilestone[] | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<FilterState | null>(null);
  const [filterDraft, setFilterDraft] = useState<FilterState | null>(null);
  const [savingFilter, setSavingFilter] = useState(false);
  const [applyingFilter, setApplyingFilter] = useState(false);
  const [copied, setCopied] = useState(false);
  const [suburbSuggestions, setSuburbSuggestions] = useState<string[]>([]);
  const matchesOffsetRef = useRef(0);
  const filterRef = useRef<FilterState | null>(null);

  const loadBrief = useCallback(async () => {
    const res = await fetch(`/api/briefs/${id}`);
    if (res.ok) {
      const data = await res.json();
      setBrief(data.brief);
      setShortlist(data.shortlist ?? []);
      const f = briefToFilter(data.brief);
      setFilter(f);
      setFilterDraft(f);
      filterRef.current = f;
    }
    setLoading(false);
  }, [id]);

  const loadMatches = useCallback(async (offset: number, replace = false, customFilter?: FilterState) => {
    setMatchesLoading(true);
    const f = customFilter ?? filterRef.current;
    const params = f ? filterToParams(f) : new URLSearchParams();
    params.set('offset', String(offset));
    const res = await fetch(`/api/briefs/${id}/matches?${params}`);
    if (res.ok) {
      const data = await res.json();
      setMatches(prev => replace ? data.matches : [...prev, ...data.matches]);
      setMatchTotal(data.total);
      setHasMore(data.hasMore);
      matchesOffsetRef.current = offset + data.matches.length;
    }
    setMatchesLoading(false);
  }, [id]);

  useEffect(() => {
    loadBrief();
    loadMatches(0, true);
    fetch('/api/properties/suburbs')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.suburbs) setSuburbSuggestions(d.suburbs); });
  }, [loadBrief, loadMatches]);

  async function reloadBrief() {
    const res = await fetch(`/api/briefs/${id}`);
    if (res.ok) {
      const data = await res.json();
      setBrief(data.brief);
      setShortlist(data.shortlist ?? []);
    }
  }

  async function applyFilter() {
    if (!filterDraft) return;
    setApplyingFilter(true);
    filterRef.current = filterDraft;
    setFilter(filterDraft);
    setMatches([]);
    setMatchTotal(null);
    await loadMatches(0, true, filterDraft);
    setApplyingFilter(false);
  }

  async function saveFilterToBrief() {
    if (!filterDraft) return;
    setSavingFilter(true);
    await fetch(`/api/briefs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: filterDraft.clientName,
        email: filterDraft.email,
        phone: filterDraft.phone,
        contactMethod: filterDraft.contactMethod,
        engagementType: filterDraft.engagementType,
        preApprovalStatus: filterDraft.preApprovalStatus,
        buyerType: filterDraft.buyerType,
        urgency: filterDraft.urgency,
        purchasePurpose: filterDraft.purchasePurpose,
        auctionWillingness: filterDraft.auctionWillingness,
        status: filterDraft.status,
        budgetMin: filterDraft.budgetMin ? parseInt(filterDraft.budgetMin) : null,
        budgetMax: filterDraft.budgetMax ? parseInt(filterDraft.budgetMax) : null,
        minBeds: parseInt(filterDraft.minBeds) || 0,
        minBaths: parseInt(filterDraft.minBaths) || 0,
        parking: filterDraft.parking,
        suburbs: filterDraft.suburbs.split(',').map(s => s.trim()).filter(Boolean),
        propertyTypes: filterDraft.propertyTypes.split(',').map(s => s.trim()).filter(Boolean),
        mustHaves: filterDraft.mustHaves.split(',').map(s => s.trim()).filter(Boolean),
        dealBreakers: filterDraft.dealBreakers.split(',').map(s => s.trim()).filter(Boolean),
      }),
    });
    await reloadBrief();
    filterRef.current = filterDraft;
    setFilter(filterDraft);
    setSavingFilter(false);
    setMatches([]);
    setMatchTotal(null);
    loadMatches(0, true, filterDraft);
  }

  async function toggleShortlist(propertyId: string) {
    if (!brief) return;
    setShortlisting(propertyId);
    const item = shortlist.find((s) => s.property?.id === propertyId);
    if (item) {
      await fetch(`/api/shortlists/${item.shortlistId}`, { method: 'DELETE' });
    } else {
      await fetch('/api/shortlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefId: id, propertyId }),
      });
    }
    await reloadBrief();
    setShortlisting(null);
  }

  async function shareWithClient(shortlistIds?: number[]) {
    setSharing(true);
    setShareMessage(null);
    const res = await fetch('/api/shortlists/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId: id, shortlistIds }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setShareMessage(`Shared ${body.sharedCount} propert${body.sharedCount === 1 ? 'y' : 'ies'} with client`);
      await reloadBrief();
    } else {
      setShareMessage(body.error ?? 'Could not share');
    }
    setSharing(false);
  }

  async function linkClient() {
    setLinking(true);
    setShareMessage(null);
    const res = await fetch(`/api/briefs/${id}/link-client`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: linkEmail || brief?.email }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setShareMessage('Client linked to this brief');
      await reloadBrief();
    } else {
      setShareMessage(body.error ?? 'Could not link client');
    }
    setLinking(false);
  }

  async function removeShortlist(shortlistId: number) {
    await fetch(`/api/shortlists/${shortlistId}`, { method: 'DELETE' });
    await reloadBrief();
  }

  function toggleCompare(propertyId: string) {
    setCompareIds(ids =>
      ids.includes(propertyId)
        ? ids.filter(x => x !== propertyId)
        : ids.length < 3 ? [...ids, propertyId] : ids
    );
  }

  function copyClientLink() {
    const url = `${window.location.origin}/client-brief/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--pg-text-dim)' }}>Loading…</div>;
  if (!brief) return <div style={{ padding: 40, color: 'var(--pg-red)' }}>Brief not found.</div>;

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
            <button type="button" className="pg-btn" onClick={copyClientLink}>
              <Icon name="share" size={13} />
              {copied ? 'Copied!' : 'Client link'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {([
            ['matches', matchTotal !== null ? `${matchTotal} matches` : 'Matches'],
            ['shortlist', `${shortlist.length} shortlisted`],
            ['roadmap', 'Roadmap'],
            ['profile', 'Client profile'],
          ] as [Tab, string][]).map(([t, l]) => (
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
            {/* Active filter chips */}
            {filter && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
                {filter.suburbs.split(',').filter(s => s.trim()).map(s => (
                  <span key={s} className="pg-badge" style={{ fontSize: 11 }}>{s.trim()}</span>
                ))}
                {filter.propertyTypes.split(',').filter(s => s.trim()).map(s => (
                  <span key={s} className="pg-badge" style={{ fontSize: 11 }}>{s.trim()}</span>
                ))}
                {filter.budgetMax && (
                  <span className="pg-badge" style={{ fontSize: 11 }}>
                    up to {parseInt(filter.budgetMax) >= 1_000_000
                      ? `$${(parseInt(filter.budgetMax) / 1_000_000).toFixed(1)}M`
                      : `$${(parseInt(filter.budgetMax) / 1000).toFixed(0)}K`}
                  </span>
                )}
                {filter.minBeds && filter.minBeds !== '0' && (
                  <span className="pg-badge" style={{ fontSize: 11 }}>{filter.minBeds}+ beds</span>
                )}
                <button className="pg-btn pg-btn-sm" style={{ marginLeft: 4 }} onClick={() => setTab('profile')}>
                  <Icon name="sliders" size={11} />Edit profile
                </button>
              </div>
            )}

            {matchesLoading && matches.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--pg-text-faint)', fontSize: 13 }}>
                Finding matches…
              </div>
            ) : matches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--pg-text-dim)' }}>
                <Icon name="building" size={36} color="var(--pg-text-very-faint)" />
                <div style={{ fontSize: 15, marginTop: 14, fontWeight: 500 }}>No matches yet</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Adjust the client profile or add suburbs to find matching properties.</div>
              </div>
            ) : (
              <>
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
                          <PropertyThumb seed={i % 6} height={38} imageUrl={m.imageUrl} style={{ width: 56, flexShrink: 0, borderRadius: 5 }} />
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
                          {shortlisting === m.id ? <Spinner /> : <Icon name="bookmark" size={11} />}
                          {shortlisting === m.id ? 'Saving…' : inShortlist ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Load more */}
                {(hasMore || matchesLoading) && (
                  <div style={{ textAlign: 'center', marginTop: 20 }}>
                    {matchesLoading ? (
                      <span style={{ fontSize: 13, color: 'var(--pg-text-faint)' }}>Loading more…</span>
                    ) : (
                      <button
                        className="pg-btn"
                        onClick={() => loadMatches(matchesOffsetRef.current)}
                      >
                        Load more ({matchTotal! - matches.length} remaining)
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'shortlist' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                {!brief.clientUserId && (
                  <>
                    <input
                      className="pg-input"
                      style={{ maxWidth: 260, fontSize: 13 }}
                      placeholder={`Client email (${brief.email})`}
                      value={linkEmail}
                      onChange={(e) => setLinkEmail(e.target.value)}
                    />
                    <button type="button" className="pg-btn pg-btn-sm" disabled={linking} onClick={linkClient}>
                      {linking ? <><Spinner />Linking…</> : 'Link client'}
                    </button>
                  </>
                )}
                {shareMessage && (
                  <span style={{ fontSize: 12, color: shareMessage.includes('Could') || shareMessage.includes('no linked') ? 'var(--pg-red)' : 'var(--pg-green)' }}>
                    {shareMessage}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="pg-btn pg-btn-primary"
                disabled={sharing || shortlist.length === 0 || !brief.clientUserId}
                onClick={() => shareWithClient()}
              >
                <Icon name="share" size={13} />
                {sharing ? <><Spinner />Sharing…</> : 'Share all with client'}
              </button>
            </div>
            {shortlist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--pg-text-dim)' }}>
                <Icon name="bookmark" size={36} color="var(--pg-text-very-faint)" />
                <div style={{ fontSize: 15, marginTop: 14, fontWeight: 500 }}>No shortlisted properties</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Save properties from the Matches tab to build the shortlist.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--pg-border)', borderRadius: 10, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '52px 1fr 120px 160px 160px',
                  padding: '8px 16px', background: 'var(--pg-bg-2)',
                  borderBottom: '1px solid var(--pg-border)', gap: 12,
                }}>
                  {['', 'Property', 'Price', 'Status', ''].map((h, i) => (
                    <div key={i} className="pg-label" style={{ fontSize: 10 }}>{h}</div>
                  ))}
                </div>
                {shortlist.map((s, i, a) => {
                  const p = s.property;
                  if (!p) return null;
                  const feedbackColors: Record<string, string> = {
                    interested: 'pg-badge-green', need_more_info: 'pg-badge-amber',
                    not_for_me: 'pg-badge-red', new: 'pg-badge-gray', viewed: 'pg-badge-gray',
                  };
                  const feedbackLabels: Record<string, string> = {
                    interested: 'Interested', need_more_info: 'Need more info',
                    not_for_me: 'Not for me', new: 'Awaiting', viewed: 'Viewed',
                  };
                  const hasFeedback = !!s.feedbackAt;
                  return (
                    <div key={s.shortlistId} style={{
                      borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none',
                      background: 'var(--pg-surface)',
                    }}>
                      <div style={{
                        display: 'grid', gridTemplateColumns: '52px 1fr 120px 160px 160px',
                        padding: '12px 16px', gap: 12, alignItems: 'center', fontSize: 13,
                      }}>
                        <div style={{ width: 52, height: 40, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                          <PropertyThumb imageUrl={p.imageUrl ?? null} size={52} style={{ width: 52, height: 40, borderRadius: 6 }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--pg-text-dim)', marginTop: 1 }}>{p.suburb}</div>
                        </div>
                        <div className="pg-mono" style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>{p.price}</div>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                          {!s.sharedAt && (
                            <span className="pg-badge pg-badge-gray" style={{ fontSize: 10 }}>Draft</span>
                          )}
                          <span className={`pg-badge ${feedbackColors[s.feedbackStatus] ?? 'pg-badge-gray'}`} style={{ fontSize: 11 }}>
                            {feedbackLabels[s.feedbackStatus] ?? s.feedbackStatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <a href={`/properties/${p.id}`} className="pg-btn pg-btn-sm">View</a>
                          {!s.sharedAt && brief.clientUserId && (
                            <button type="button" className="pg-btn pg-btn-sm" onClick={() => shareWithClient([s.shortlistId])}>Share</button>
                          )}
                          <button type="button" className="pg-btn pg-btn-sm pg-btn-ghost" onClick={() => removeShortlist(s.shortlistId)}>Remove</button>
                        </div>
                      </div>
                      {hasFeedback && (
                        <div style={{
                          margin: '0 16px 12px', padding: '9px 12px', borderRadius: 7,
                          background: s.feedbackStatus === 'interested' ? 'color-mix(in srgb, var(--pg-green-tint) 50%, white)'
                            : s.feedbackStatus === 'not_for_me' ? 'color-mix(in srgb, var(--pg-red-tint) 50%, white)'
                            : s.feedbackStatus === 'need_more_info' ? 'color-mix(in srgb, var(--pg-amber-tint) 50%, white)'
                            : 'var(--pg-bg-2)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                            <span className="pg-label" style={{ fontSize: 10 }}>Client feedback</span>
                            {s.feedbackAt && (
                              <span style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>
                                {new Date(s.feedbackAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                          {s.feedbackReason && (
                            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--pg-text)', marginBottom: s.feedbackText ? 2 : 0 }}>
                              {s.feedbackReason}
                            </div>
                          )}
                          {s.feedbackText && (
                            <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', fontStyle: 'italic' }}>
                              &ldquo;{s.feedbackText}&rdquo;
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'profile' && filterDraft && (
          <div style={{ maxWidth: 720 }}>
            <ProfileSection title="Contact details">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <ProfileField label="Full name" value={filterDraft.clientName}
                  onChange={v => setFilterDraft(d => d ? { ...d, clientName: v } : d)} />
                <ProfileField label="Email" value={filterDraft.email}
                  onChange={v => setFilterDraft(d => d ? { ...d, email: v } : d)} />
                <ProfileField label="Phone" value={filterDraft.phone}
                  onChange={v => setFilterDraft(d => d ? { ...d, phone: v } : d)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 14 }}>
                <ProfileSelect label="Preferred contact" value={filterDraft.contactMethod}
                  onChange={v => setFilterDraft(d => d ? { ...d, contactMethod: v } : d)}
                  options={[['email', 'Email'], ['phone', 'Phone'], ['sms', 'SMS']]} />
                <ProfileSelect label="Engagement type" value={filterDraft.engagementType}
                  onChange={v => setFilterDraft(d => d ? { ...d, engagementType: v } : d)}
                  options={[['full-service', 'Full service'], ['auction-only', 'Auction only'], ['consult', 'Consult only']]} />
                <ProfileSelect label="Brief status" value={filterDraft.status}
                  onChange={v => setFilterDraft(d => d ? { ...d, status: v } : d)}
                  options={[['searching', 'Searching'], ['under-offer', 'Under offer'], ['settled', 'Settled'], ['paused', 'Paused']]} />
              </div>
            </ProfileSection>

            <ProfileSection title="Buyer background">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <ProfileSelect label="Buyer type" value={filterDraft.buyerType}
                  onChange={v => setFilterDraft(d => d ? { ...d, buyerType: v } : d)}
                  options={[['owner-occupier', 'Owner-occupier'], ['investor', 'Investor'], ['downsizer', 'Downsizer'], ['first-home', 'First home buyer']]} />
                <ProfileSelect label="Purchase purpose" value={filterDraft.purchasePurpose}
                  onChange={v => setFilterDraft(d => d ? { ...d, purchasePurpose: v } : d)}
                  options={[['PPOR', 'Principal residence'], ['Investment', 'Investment'], ['Holiday', 'Holiday home']]} />
                <ProfileSelect label="Urgency" value={filterDraft.urgency}
                  onChange={v => setFilterDraft(d => d ? { ...d, urgency: v } : d)}
                  options={[['ASAP', 'ASAP'], ['1 month', '1 month'], ['3 months', '3 months'], ['6 months', '6+ months']]} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 14 }}>
                <ProfileSelect label="Pre-approval status" value={filterDraft.preApprovalStatus}
                  onChange={v => setFilterDraft(d => d ? { ...d, preApprovalStatus: v } : d)}
                  options={[['Not Started', 'Not started'], ['In Progress', 'In progress'], ['Approved', 'Approved'], ['Expired', 'Expired']]} />
                <ProfileSelect label="Auction willingness" value={filterDraft.auctionWillingness ? 'yes' : 'no'}
                  onChange={v => setFilterDraft(d => d ? { ...d, auctionWillingness: v === 'yes' } : d)}
                  options={[['yes', 'Will bid at auction'], ['no', 'Prefers private sale']]} />
              </div>
            </ProfileSection>

            <ProfileSection title="Search criteria">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <ProfileField label="Budget min ($)" value={filterDraft.budgetMin} placeholder="e.g. 800000"
                  onChange={v => setFilterDraft(d => d ? { ...d, budgetMin: v } : d)} />
                <ProfileField label="Budget max ($)" value={filterDraft.budgetMax} placeholder="e.g. 1500000"
                  onChange={v => setFilterDraft(d => d ? { ...d, budgetMax: v } : d)} />
                <ProfileSelect label="Parking" value={filterDraft.parking}
                  onChange={v => setFilterDraft(d => d ? { ...d, parking: v } : d)}
                  options={[['not_needed', 'Not needed'], ['nice_to_have', 'Nice to have'], ['required', 'Required']]} />
                <ProfileField label="Min bedrooms" value={filterDraft.minBeds} type="number"
                  onChange={v => setFilterDraft(d => d ? { ...d, minBeds: v } : d)} />
                <ProfileField label="Min bathrooms" value={filterDraft.minBaths} type="number"
                  onChange={v => setFilterDraft(d => d ? { ...d, minBaths: v } : d)} />
              </div>
              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <TagInput label="Suburbs" value={filterDraft.suburbs}
                  placeholder="Type to search or add…"
                  suggestions={suburbSuggestions}
                  onChange={v => setFilterDraft(d => d ? { ...d, suburbs: v } : d)} />
                <TagInput label="Property types" value={filterDraft.propertyTypes}
                  placeholder="Type to search or add…"
                  suggestions={PROPERTY_TYPE_SUGGESTIONS}
                  onChange={v => setFilterDraft(d => d ? { ...d, propertyTypes: v } : d)} />
              </div>
            </ProfileSection>

            <ProfileSection title="Must-haves & deal-breakers">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <TagInput label="Must-haves" value={filterDraft.mustHaves}
                  placeholder="e.g. North-facing, garage, study…"
                  suggestions={FEATURE_SUGGESTIONS}
                  onChange={v => setFilterDraft(d => d ? { ...d, mustHaves: v } : d)} />
                <TagInput label="Deal-breakers" value={filterDraft.dealBreakers}
                  placeholder="e.g. Busy road, strata, flood zone…"
                  suggestions={FEATURE_SUGGESTIONS}
                  onChange={v => setFilterDraft(d => d ? { ...d, dealBreakers: v } : d)} />
              </div>
            </ProfileSection>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                className="pg-btn pg-btn-accent"
                disabled={applyingFilter || savingFilter}
                onClick={() => applyFilter().then(() => setTab('matches'))}
              >
                {applyingFilter
                  ? <><Spinner />Applying…</>
                  : 'Apply preview'}
              </button>
              <button
                className="pg-btn"
                disabled={savingFilter || applyingFilter}
                onClick={() => saveFilterToBrief().then(() => setTab('matches'))}
              >
                {savingFilter
                  ? <><Spinner />Saving…</>
                  : 'Save to profile'}
              </button>
              <button className="pg-btn pg-btn-ghost" disabled={savingFilter || applyingFilter} onClick={() => { setFilterDraft(filter); setTab('matches'); }}>Cancel</button>
            </div>
          </div>
        )}

        {tab === 'roadmap' && (
          <RoadmapTab roadmap={roadmap} onInit={() => setRoadmap(generateDefaultRoadmap(new Date()))} onChange={setRoadmap} />
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" style={{ animation: 'pg-spin 0.7s linear infinite', flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <path d="M6.5 1.5 A5 5 0 0 1 11.5 6.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Profile tab helpers ───────────────────────────────────────────────────────

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--pg-text-faint)', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function ProfileField({ label, value, onChange, placeholder, type }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>
      {label}
      <input className="pg-input" type={type ?? 'text'} style={{ display: 'block', width: '100%', marginTop: 4, fontSize: 13 }}
        placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </label>
  );
}

function ProfileSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <label style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>
      {label}
      <select className="pg-input" style={{ display: 'block', width: '100%', marginTop: 4, fontSize: 13 }}
        value={value} onChange={e => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function TagInput({ label, value, onChange, placeholder, suggestions }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; suggestions?: string[];
}) {
  const tags = value.split(',').map(s => s.trim()).filter(Boolean);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = suggestions?.filter(s =>
    s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  ) ?? [];

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed].join(', '));
    setInput('');
    setOpen(false);
  }

  function removeTag(tag: string) {
    onChange(tags.filter(t => t !== tag).join(', '));
  }

  return (
    <label style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>
      {label}
      <div style={{ position: 'relative', marginTop: 4 }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 5, padding: '6px 8px',
          border: '1px solid var(--pg-border)', borderRadius: 8,
          background: 'var(--pg-bg)', minHeight: 38, alignItems: 'center',
        }}>
          {tags.map(t => (
            <span key={t} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 999,
              background: 'var(--pg-bg-2)', border: '1px solid var(--pg-border)',
              fontSize: 12, color: 'var(--pg-text)',
            }}>
              {t}
              <button type="button" onMouseDown={e => { e.preventDefault(); removeTag(t); }} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--pg-text-faint)', fontSize: 14, lineHeight: 1, padding: 0,
              }}>×</button>
            </span>
          ))}
          <input
            style={{ flex: 1, minWidth: 80, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--pg-text)', fontFamily: 'var(--pg-font-body)' }}
            placeholder={tags.length === 0 ? placeholder : 'Add…'}
            value={input}
            onChange={e => { setInput(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={e => {
              if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
                e.preventDefault();
                addTag(input);
              }
              if (e.key === 'Backspace' && !input && tags.length) {
                removeTag(tags[tags.length - 1]);
              }
            }}
          />
        </div>
        {open && (filtered.length > 0 || input.trim()) && (
          <div
            onMouseDown={e => e.preventDefault()}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
              background: 'var(--pg-surface)', border: '1px solid var(--pg-border)',
              borderRadius: 8, marginTop: 2, maxHeight: 200, overflow: 'auto',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            }}>
            {filtered.map(s => (
              <div key={s} onMouseDown={() => addTag(s)} style={{
                padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: 'var(--pg-text)',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--pg-bg-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >{s}</div>
            ))}
            {input.trim() && !filtered.some(s => s.toLowerCase() === input.trim().toLowerCase()) && (
              <div onMouseDown={() => addTag(input)} style={{
                padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: 'var(--pg-accent)',
              }}>Add &ldquo;{input.trim()}&rdquo;</div>
            )}
          </div>
        )}
      </div>
    </label>
  );
}


const PROPERTY_TYPE_SUGGESTIONS = [
  'House', 'Apartment', 'Townhouse', 'Unit', 'Villa', 'Studio',
  'Duplex', 'Terrace', 'Semi-detached', 'Acreage', 'Block of units',
];

const FEATURE_SUGGESTIONS = [
  'North-facing', 'Garage', 'Study', 'Pool', 'Garden', 'Balcony',
  'Double garage', 'Ensuite', 'Walk-in robe', 'Ducted heating',
  'Air conditioning', 'Dishwasher', 'Floorboards', 'Period features',
  'School catchment', 'Near train', 'Corner block', 'Views',
];

function RoadmapTab({ roadmap, onInit, onChange }: {
  roadmap: RoadmapMilestone[] | null;
  onInit: () => void;
  onChange: (ms: RoadmapMilestone[]) => void;
}) {
  if (!roadmap) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--pg-text-dim)' }}>
        <Icon name="calendar" size={36} color="var(--pg-text-very-faint)" />
        <div style={{ fontSize: 15, marginTop: 14, fontWeight: 500 }}>No strategy roadmap yet</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Generate a default timeline to share the purchase journey with your client.</div>
        <button className="pg-btn pg-btn-primary" style={{ marginTop: 16 }} onClick={onInit}>
          Generate roadmap
        </button>
      </div>
    );
  }

  const totalDays = roadmap.reduce((s, m) => s + m.durationDays, 0);
  const totalWeeks = Math.round(totalDays / 7);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--pg-text-dim)' }}>
          {roadmap.length} milestones · ~{totalWeeks} weeks total
        </div>
        <div style={{ flex: 1 }} />
        <button className="pg-btn pg-btn-sm" onClick={onInit}>Reset to defaults</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }} className="pg-card-flat">
        {roadmap.map((m, i) => (
          <div key={m.id} style={{
            display: 'grid', gridTemplateColumns: '200px 1fr 120px 120px',
            padding: '14px 16px', alignItems: 'center', gap: 16, fontSize: 13,
            borderBottom: i < roadmap.length - 1 ? '1px solid var(--pg-border)' : 'none',
          }}>
            <div>
              <div style={{ fontWeight: 500 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', marginTop: 2 }}>
                {m.startDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                {' → '}
                {m.endDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </div>
            </div>
            <div style={{ height: 8, background: 'var(--pg-bg-2)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--pg-accent)', borderRadius: 999, width: `${Math.min(100, (m.durationDays / 42) * 100)}%` }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" min={1} max={180} value={m.durationDays}
                onChange={e => onChange(calcRoadmapDates(roadmap, i, Math.max(1, Number(e.target.value))))}
                style={{ width: 54, padding: '4px 8px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 13, textAlign: 'center' }} />
              <span style={{ fontSize: 12, color: 'var(--pg-text-faint)' }}>days</span>
            </div>
            <div>
              <input type="text" value={m.notes} placeholder="Add note…"
                onChange={e => onChange(roadmap.map((x, j) => j === i ? { ...x, notes: e.target.value } : x))}
                style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 12 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
