'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@/components/shared/icon';
import { PropertyThumb } from '@/components/shared/property-thumb';
import { GanttRoadmap } from '@/components/shared/gantt-roadmap';
import type { RoadmapMilestone } from '@/lib/roadmap-utils';

interface ShortlistItem {
  shortlistId: number;
  agentNote: string | null;
  feedbackStatus: string;
  feedbackText: string | null;
  sharedAt: string | null;
  property: {
    id: string; address: string | null; suburb: string | null; state: string | null;
    price: string; propertyType: string | null;
    bedrooms: number | null; bathrooms: number | null; parkingSpaces: number | null;
    score: number; imageUrl: string | null;
  } | null;
}

interface Brief {
  id: number; clientName: string; suburbs: string[];
  budgetMin: number | null; budgetMax: number | null;
  roadmap?: Array<{ id: string; label: string; startDate: string; endDate: string; durationDays: number; notes: string }>;
}

const STATUS_BUTTONS = [
  { id: 'interested', label: 'Interested', icon: 'thumbs-up' as const, color: 'var(--pg-green)', tint: 'rgba(34,197,94,0.08)' },
  { id: 'need_more_info', label: 'Need info', icon: 'help-circle' as const, color: 'var(--pg-amber)', tint: 'rgba(245,158,11,0.08)' },
  { id: 'not_for_me', label: 'Not for me', icon: 'thumbs-down' as const, color: 'var(--pg-red)', tint: 'rgba(239,68,68,0.08)' },
];

const NOT_FOR_ME_REASONS = [
  'Wrong area', 'Over budget', "Don't like the style",
  'Too small', 'Too large', 'Wrong property type',
];

const STATUS_BADGE: Record<string, string> = {
  interested: 'pg-badge-green',
  need_more_info: 'pg-badge-amber',
  not_for_me: 'pg-badge-red',
};
const STATUS_LABEL: Record<string, string> = {
  new: 'New', viewed: 'Viewed', interested: 'Interested',
  need_more_info: 'Need more info', not_for_me: 'Not for me',
};

function PropertyFeedbackCard({
  item, briefId, idx, onUpdated,
}: {
  item: ShortlistItem; briefId: number; idx: number; onUpdated: (shortlistId: number, status: string, text: string) => void;
}) {
  const p = item.property;
  const [status, setStatus] = useState(item.feedbackStatus);
  const [text, setText] = useState(item.feedbackText ?? '');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  async function submit(newStatus: string, newReason?: string) {
    setSaving(true);
    const res = await fetch(`/api/client-brief/${briefId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortlistId: item.shortlistId, feedbackStatus: newStatus, feedbackText: text || null }),
    });
    if (res.ok) {
      setStatus(newStatus);
      onUpdated(item.shortlistId, newStatus, text);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
    if (newReason) setReason(newReason);
  }

  if (!p) return null;

  return (
    <div className="pg-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <PropertyThumb seed={idx} height={180} imageUrl={p.imageUrl} />
      <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }} className="pg-truncate">{p.address}</div>
            <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>{p.suburb}, {p.state}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div className="pg-mono" style={{ fontSize: 13, fontWeight: 600 }}>{p.price}</div>
            {status !== 'new' && (
              <span className={`pg-badge ${STATUS_BADGE[status] ?? ''}`} style={{ fontSize: 10.5 }}>
                {STATUS_LABEL[status] ?? status}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 8, fontSize: 11.5, color: 'var(--pg-text-dim)' }}>
          {p.bedrooms != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="bed" size={11} />{p.bedrooms}</span>}
          {p.bathrooms != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="bath" size={11} />{p.bathrooms}</span>}
          {p.parkingSpaces != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="car" size={11} />{p.parkingSpaces}</span>}
          <span style={{ marginLeft: 'auto' }}>{p.propertyType ?? ''}</span>
        </div>

        {item.agentNote && (
          <div style={{
            marginTop: 12, padding: '10px 12px',
            background: 'var(--pg-accent-soft)', borderRadius: 7,
            fontSize: 12, color: 'var(--pg-text)', lineHeight: 1.45,
            display: 'flex', gap: 8,
          }}>
            <Icon name="sparkles" size={12} color="var(--pg-accent)" style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontStyle: 'italic' }}>{item.agentNote}</span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Feedback buttons */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {STATUS_BUTTONS.map(b => {
              const active = status === b.id;
              return (
                <button key={b.id} onClick={() => {
                  submit(b.id);
                  if (b.id === 'need_more_info') setTimeout(() => textRef.current?.focus(), 50);
                }} disabled={saving} style={{
                  background: active ? b.tint : 'transparent',
                  border: '1px solid',
                  borderColor: active ? 'transparent' : 'var(--pg-border)',
                  color: active ? b.color : 'var(--pg-text-dim)',
                  borderRadius: 6, padding: '8px 4px',
                  fontSize: 12, fontWeight: active ? 500 : 400,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  transition: 'all 0.15s',
                }}>
                  <Icon name={b.icon} size={11} strokeWidth={active ? 1.8 : 1.5} />
                  {b.label}
                </button>
              );
            })}
          </div>

          {status === 'not_for_me' && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
              {NOT_FOR_ME_REASONS.map(r => (
                <button key={r} onClick={() => { setReason(r); submit('not_for_me'); }}
                  style={{
                    padding: '3px 9px', borderRadius: 999, fontSize: 11,
                    border: '1px solid',
                    borderColor: reason === r ? 'var(--pg-red)' : 'var(--pg-border)',
                    background: reason === r ? 'rgba(239,68,68,0.08)' : 'transparent',
                    color: reason === r ? 'var(--pg-red)' : 'var(--pg-text-dim)',
                    cursor: 'pointer',
                  }}>
                  {r}
                </button>
              ))}
            </div>
          )}

          <textarea
            ref={textRef}
            placeholder={status === 'need_more_info' ? 'What would you like to know?' : 'Add a note for your agent…'}
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={() => { if (text !== (item.feedbackText ?? '') && status !== 'new') submit(status); }}
            rows={2}
            style={{
              width: '100%', marginTop: 10, padding: '8px 10px',
              border: '1px solid var(--pg-border)', borderRadius: 6,
              background: 'var(--pg-bg)', color: 'var(--pg-text)',
              fontSize: 12.5, lineHeight: 1.5, resize: 'none',
              fontFamily: 'var(--pg-font-body)', boxSizing: 'border-box',
            }}
          />

          {saved && (
            <div style={{ fontSize: 11, color: 'var(--pg-green)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="check" size={10} color="var(--pg-green)" /> Saved
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClientBriefPage() {
  const { id } = useParams<{ id: string }>();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [items, setItems] = useState<ShortlistItem[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapMilestone[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/client-brief/${id}`);
    if (!res.ok) { setNotFound(true); setLoading(false); return; }
    const data = await res.json();
    setBrief(data.brief);
    setItems(data.items ?? []);
    const rm = data.brief?.roadmap;
    if (Array.isArray(rm) && rm.length > 0) {
      setRoadmap(rm.map((m: { id: string; label: string; startDate: string; endDate: string; durationDays: number; notes: string }) => ({
        id: m.id, label: m.label,
        startDate: new Date(m.startDate), endDate: new Date(m.endDate),
        durationDays: m.durationDays, notes: m.notes,
      })));
    } else {
      setRoadmap(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function handleUpdated(shortlistId: number, status: string, text: string) {
    setItems(prev => prev.map(it =>
      it.shortlistId === shortlistId ? { ...it, feedbackStatus: status, feedbackText: text } : it
    ));
  }

  const properties = items.filter(it => it.property);
  const awaitingFeedback = properties.filter(p => p.feedbackStatus === 'new').length;
  const firstName = brief?.clientName.split(' ')[0] ?? 'there';

  if (loading) {
    return (
      <div className="pg" style={{ minHeight: '100vh', background: 'var(--pg-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--pg-text-faint)', fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="pg" style={{ minHeight: '100vh', background: 'var(--pg-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--pg-text-dim)' }}>
          <Icon name="building" size={40} color="var(--pg-text-very-faint)" />
          <div style={{ fontSize: 16, marginTop: 14, fontWeight: 500 }}>Link not found</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>This client portal link may be invalid or expired.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 32px 64px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, color: 'var(--pg-text-faint)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 className="pg-display" style={{ margin: 0, fontSize: 34, fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Hi {firstName}, here are your properties.
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--pg-text-dim)', maxWidth: 560, lineHeight: 1.55 }}>
            {properties.length > 0
              ? <>Your agent has shared <strong style={{ color: 'var(--pg-text)' }}>{properties.length} propert{properties.length === 1 ? 'y' : 'ies'}</strong> for your review.
                  {awaitingFeedback > 0 && <> <strong style={{ color: 'var(--pg-accent)' }}>{awaitingFeedback}</strong> waiting for your feedback.</>}
                </>
              : 'Your agent will share properties here when they find matches for your brief.'}
          </p>
          {brief?.suburbs && brief.suburbs.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {brief.suburbs.map(s => (
                <span key={s} className="pg-badge" style={{ fontSize: 11 }}>{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* Properties */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
          <h2 className="pg-display" style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>Properties to review</h2>
          <span style={{ fontSize: 12.5, color: 'var(--pg-text-faint)' }}>
            {properties.length} shortlisted · {awaitingFeedback} awaiting feedback
          </span>
        </div>

        {properties.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--pg-text-dim)' }}>
            <Icon name="building" size={40} color="var(--pg-text-very-faint)" />
            <div style={{ fontSize: 15, marginTop: 14, fontWeight: 500 }}>No properties yet</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Your agent will share properties here when they find matches.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 48 }}>
            {properties.map((item, i) => (
              <PropertyFeedbackCard
                key={item.shortlistId}
                item={item}
                briefId={Number(id)}
                idx={i}
                onUpdated={handleUpdated}
              />
            ))}
          </div>
        )}

        {/* Summary of selections */}
        {properties.some(p => p.feedbackStatus !== 'new') && (
          <div style={{
            padding: 22, background: 'var(--pg-bg-2)', borderRadius: 12,
            display: 'flex', alignItems: 'flex-start', gap: 18,
          }}>
            <Icon name="check" size={20} color="var(--pg-green)" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Your selections so far</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
                {['interested', 'need_more_info', 'not_for_me'].map(s => {
                  const count = properties.filter(p => p.feedbackStatus === s).length;
                  if (!count) return null;
                  return (
                    <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--pg-text-dim)' }}>
                      <span className={`pg-badge ${STATUS_BADGE[s]}`} style={{ fontSize: 10.5 }}>{STATUS_LABEL[s]}</span>
                      {count} propert{count === 1 ? 'y' : 'ies'}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Strategy Roadmap */}
        {roadmap && (
          <div style={{ marginTop: 48 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
              <h2 className="pg-display" style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>Strategy Roadmap</h2>
              <span style={{ fontSize: 12.5, color: 'var(--pg-text-faint)' }}>
                {roadmap.length} milestones · ~{Math.round(roadmap.reduce((s, m) => s + m.durationDays, 0) / 7)} weeks total
              </span>
            </div>
            <GanttRoadmap roadmap={roadmap} />
          </div>
        )}
    </div>
  );
}
