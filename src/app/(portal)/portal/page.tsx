import { db } from '@/lib/db';
import { propertiesTable } from '@/lib/db/schema';
import { desc, gt } from 'drizzle-orm';
import { Icon } from '@/components/shared/icon';
import { PropertyThumb } from '@/components/shared/property-thumb';

function formatPrice(price: number | null, display: string | null): string {
  if (display) return display;
  if (!price || price === 0) return 'POA';
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${(price / 1000).toFixed(0)}K`;
}

const TASKS = [
  { l: 'Confirm cooling-off decision', done: true, when: 'Completed 22 May' },
  { l: 'Sign loan documents with Westpac', done: true, when: 'Completed 20 May' },
  { l: 'Pay stamp duty ($73,820)', done: true, when: 'Receipt with conveyancer' },
  { l: 'Arrange building insurance', done: false, when: 'Due Fri 9 Jun', urgent: false },
  { l: 'Pre-settlement inspection booking', done: false, when: 'With Jess · Thu 8 Jun', urgent: false },
  { l: 'Final inspection (you attend)', done: false, when: 'Wed 14 Jun, 4pm', urgent: true },
];

const ACTIVITY = [
  { t: 'Today, 09:14', e: 'Jess added a new property to your shortlist', i: 'sparkles', c: 'var(--pg-accent)' },
  { t: 'Yesterday', e: 'You marked 5 Tennyson St as Not for me', i: 'thumbs-down', c: 'var(--pg-red)' },
  { t: '20 May', e: 'Settlement contract for 12 Smith St signed by both parties — well done!', i: 'check', c: 'var(--pg-green)' },
  { t: '18 May', e: 'Vendor accepted your offer of $1.42M on 12 Smith St', i: 'check', c: 'var(--pg-green)' },
  { t: '16 May', e: 'Counter-offer from vendor on 47 Domain Rd: $2.95M', i: 'send', c: 'var(--pg-text-dim)' },
];

const FEEDBACK_STATES = [
  { l: 'Interested', class: 'pg-badge-green', partner: { l: 'Tom: Interested ✓', c: 'var(--pg-green)' }, active: true },
  { l: 'You: Interested', class: 'pg-badge-green', partner: { l: 'Tom: Need more info', c: 'var(--pg-amber)' }, active: true },
  { l: 'New', class: 'pg-badge', partner: null, active: false },
];

const NOTES = [
  'North-facing, walk to station — strong match on your school catchment priority',
  'Period-detail home, large garden — matches your outdoor space brief',
  'Compact warehouse conversion — could suit if you reconsider 2-bed',
];

const TAGS = [
  'New · added 9:14am',
  'Auction Sat 26 May, 11am',
  'New · added yesterday',
];

export default async function ClientPortalPage() {
  const properties = await db.select()
    .from(propertiesTable)
    .where(gt(propertiesTable.price, 0))
    .orderBy(desc(propertiesTable.overallScore))
    .limit(3);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 32px 64px' }}>

      {/* Welcome */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, marginBottom: 40 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--pg-text-faint)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>Tuesday, 23 May</div>
          <h1 className="pg-display" style={{ margin: 0, fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Welcome back, Sarah.
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--pg-text-dim)', maxWidth: 560, lineHeight: 1.55 }}>
            Jess has added <span style={{ color: 'var(--pg-text)', fontWeight: 500 }}>three new properties</span> to review since yesterday. Your offer on 47 Domain Rd is in counter-negotiation.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', background: 'var(--pg-surface)', border: '1px solid var(--pg-border)', borderRadius: 10 }}>
          <div className="pg-avatar pg-avatar-lg" style={{ background: '#1A1814', color: '#FAFAF7', borderColor: '#1A1814' }}>JM</div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>Your agent</div>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>Jess Morgan</div>
            <div style={{ fontSize: 11.5, color: 'var(--pg-text-dim)', marginTop: 1 }}>+ 61 411 234 567</div>
          </div>
          <button className="pg-btn pg-btn-icon" style={{ marginLeft: 8 }}><Icon name="phone" size={14} /></button>
        </div>
      </div>

      {/* Settlement strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: '0.7fr 1fr',
        background: 'var(--pg-surface)',
        border: '1px solid var(--pg-border)',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 36,
      }}>
        <div style={{ padding: 24, background: 'var(--pg-bg-2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="pg-label" style={{ marginBottom: 8 }}>Your settlement</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>12 Smith St, Richmond</div>
            <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginTop: 2 }}>$1.42M · Contract signed 18 May</div>
          </div>
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div className="pg-display" style={{ fontSize: 56, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.025em' }}>24</div>
              <div style={{ fontSize: 13, color: 'var(--pg-text-dim)' }}>days until<br />settlement</div>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--pg-text-faint)', marginTop: 8 }}>Fri 16 Jun, 14:00 · PEXA settle</div>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span className="pg-label">What you need to do</span>
            <span className="pg-badge" style={{ fontSize: 10.5 }}>3 of 6 done</span>
          </div>
          {TASKS.map((task, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '9px 0',
              borderBottom: i < TASKS.length - 1 ? '1px solid var(--pg-border)' : 'none',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 999,
                background: task.done ? 'var(--pg-green)' : 'transparent',
                border: task.done ? 'none' : `1.5px solid ${'urgent' in task && task.urgent ? 'var(--pg-amber)' : 'var(--pg-text-very-faint)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {task.done && <Icon name="check" size={11} color="#FFF" strokeWidth={3} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: task.done ? 'var(--pg-text-dim)' : 'var(--pg-text)', textDecoration: task.done ? 'line-through' : 'none' }}>{task.l}</div>
                <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', marginTop: 1 }}>{task.when}</div>
              </div>
              {!task.done && (
                <button className="pg-btn pg-btn-sm" style={{ flexShrink: 0 }}>{'urgent' in task && task.urgent ? 'Schedule' : 'Action'}</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Properties section */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
        <h2 className="pg-display" style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>Properties to review</h2>
        <span style={{ fontSize: 12.5, color: 'var(--pg-text-faint)' }}>{properties.length} shortlisted · 2 awaiting your feedback</span>
        <div style={{ flex: 1 }} />
        <button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ color: 'var(--pg-text-dim)' }}>
          <Icon name="grid" size={12} />Compare side-by-side
        </button>
      </div>

      {/* Property grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 48 }}>
        {properties.map((p, i) => {
          const price = formatPrice(p.price, p.priceDisplay);
          const fb = FEEDBACK_STATES[i] ?? FEEDBACK_STATES[2];
          return (
            <div key={p.id} className="pg-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <PropertyThumb seed={i} height={180} />
              <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }} className="pg-truncate">{p.address}</div>
                    <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>{p.suburb}, {p.state}</div>
                  </div>
                  <div className="pg-mono" style={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{price}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 8, fontSize: 11.5, color: 'var(--pg-text-dim)' }}>
                  {p.bedrooms != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="bed" size={11} />{p.bedrooms}</span>}
                  {p.bathrooms != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="bath" size={11} />{p.bathrooms}</span>}
                  {p.parkingSpaces != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="car" size={11} />{p.parkingSpaces}</span>}
                  <div style={{ flex: 1 }} />
                  <span style={{ color: 'var(--pg-text-faint)', fontSize: 11 }}>{TAGS[i]}</span>
                </div>

                <div style={{
                  marginTop: 12, padding: '10px 12px',
                  background: 'var(--pg-accent-soft)', borderRadius: 7,
                  fontSize: 12, color: 'var(--pg-text)', lineHeight: 1.45,
                  display: 'flex', gap: 8,
                }}>
                  <Icon name="sparkles" size={12} color="var(--pg-accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontStyle: 'italic' }}>{NOTES[i]}</span>
                </div>

                <div style={{ flex: 1 }} />

                {fb.partner && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--pg-border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                    <span className={`pg-badge ${fb.class}`} style={{ fontSize: 10.5 }}>{fb.l.replace('You: ', '')}</span>
                    <span style={{ color: fb.partner.c }}>{fb.partner.l}</span>
                  </div>
                )}

                {/* Feedback buttons */}
                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {[
                    { l: 'Interested', icon: 'thumbs-up', c: 'var(--pg-green)', tint: 'rgba(34,197,94,0.08)', active: fb.active && fb.l.includes('Interested') },
                    { l: 'Need info', icon: 'help-circle', c: 'var(--pg-amber)', tint: 'rgba(245,158,11,0.08)', active: false },
                    { l: 'Not for me', icon: 'thumbs-down', c: 'var(--pg-red)', tint: 'rgba(239,68,68,0.08)', active: false },
                  ].map((b, j) => (
                    <button key={j} style={{
                      background: b.active ? b.tint : 'transparent',
                      border: '1px solid',
                      borderColor: b.active ? 'transparent' : 'var(--pg-border)',
                      color: b.active ? b.c : 'var(--pg-text-dim)',
                      borderRadius: 6, padding: '7px 4px',
                      fontSize: 11.5, fontWeight: b.active ? 500 : 400,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                      <Icon name={b.icon as 'thumbs-up' | 'help-circle' | 'thumbs-down'} size={11} strokeWidth={b.active ? 1.8 : 1.5} />
                      {b.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggest a property */}
      <div style={{
        padding: 22, background: 'var(--pg-bg-2)', borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 18, marginBottom: 48,
      }}>
        <Icon name="sparkles" size={20} color="var(--pg-accent)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Seen something on Domain or REA?</div>
          <div style={{ fontSize: 12.5, color: 'var(--pg-text-dim)', marginTop: 2 }}>Paste the listing URL and Jess will review it for you.</div>
        </div>
        <div style={{ flex: '0 0 360px', display: 'flex', gap: 6 }}>
          <input className="pg-input" placeholder="https://www.domain.com.au/..." style={{ flex: 1 }} />
          <button className="pg-btn pg-btn-accent">Send to Jess</button>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="pg-display" style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 500 }}>Recent activity</h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {ACTIVITY.map((a, i) => (
            <div key={i} style={{
              display: 'flex', gap: 14, padding: '13px 0',
              borderBottom: i < ACTIVITY.length - 1 ? '1px solid var(--pg-border)' : 'none',
              alignItems: 'flex-start',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 999,
                background: 'var(--pg-bg-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name={a.i as 'sparkles' | 'thumbs-down' | 'check' | 'send'} size={13} color={a.c} />
              </div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ fontSize: 13.5 }}>{a.e}</div>
                <div style={{ fontSize: 11.5, color: 'var(--pg-text-faint)', marginTop: 2 }}>{a.t}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
