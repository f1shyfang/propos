import { db } from '@/lib/db';
import { propertiesTable } from '@/lib/db/schema';
import { desc, count, sql } from 'drizzle-orm';
import { TopBar } from '@/components/shared/top-bar';
import { Icon } from '@/components/shared/icon';
import { Sparkline } from '@/components/shared/sparkline';
import { PropertyThumb } from '@/components/shared/property-thumb';
import { MatchScore } from '@/components/shared/match-score';

function scoreToMatchPct(overall: number | null): number {
  if (!overall) return 50;
  return Math.min(99, Math.max(40, Math.round((overall / 8000) * 100)));
}

function formatPrice(price: number | null, display: string | null): string {
  if (display) return display;
  if (!price) return '—';
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${(price / 1000).toFixed(0)}K`;
}

export default async function DashboardPage() {
  const [propCount, topProperties] = await Promise.all([
    db.select({ n: count() }).from(propertiesTable),
    db.select().from(propertiesTable)
      .where(sql`${propertiesTable.price} > 0`)
      .orderBy(desc(propertiesTable.overallScore))
      .limit(4),
  ]);

  const totalProps = Number(propCount[0]?.n ?? 0);

  const feedbackRows = topProperties.map((p, i) => ({
    addr: p.address ?? '—',
    sub: `${p.suburb ?? ''}, ${p.state ?? ''}`,
    client: ['Sarah & Tom Chen', 'Priya Anand', 'The Holloways', 'Marcus Webb'][i],
    initials: ['SC', 'PA', 'HH', 'MW'][i],
    score: scoreToMatchPct(p.overallScore),
    price: formatPrice(p.price, p.priceDisplay),
    status: ['Interested', 'Need more info', 'Split decision', 'New'][i],
    statusClass: ['pg-badge-green', 'pg-badge-amber', 'pg-badge-purple', ''][i],
    shared: ['2h ago', '5h ago', '1d ago', '8h ago'][i],
    seed: i,
    id: p.id,
  }));

  return (
    <div style={{ padding: 0 }}>
      <TopBar
        eyebrow="Tuesday, 23 May"
        title="Good morning, Jess."
        actions={
          <>
            <button className="pg-btn"><Icon name="plus" size={13} />Add client</button>
            <button className="pg-btn pg-btn-primary">
              <Icon name="sparkles" size={13} />
              8 new matches
            </button>
          </>
        }
      />

      <div style={{ padding: '8px 32px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Signal stats */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36, paddingBottom: 24, borderBottom: '1px solid var(--pg-border)' }}>
          <Signal
            label="Active clients"
            value="23"
            sub="3 onboarding this week"
            spark={[8, 10, 9, 12, 14, 13, 17, 19, 18, 21, 23]}
          />
          <Signal
            label="In pipeline"
            value="$48.2M"
            sub="14 deals across 6 stages"
            spark={[30, 33, 32, 36, 38, 41, 40, 44, 45, 48, 48]}
            trendColor="var(--pg-green)"
          />
          <Signal
            label={`Properties tracked`}
            value={totalProps > 1000 ? `${(totalProps / 1000).toFixed(1)}K` : String(totalProps)}
            sub="Settling this month: 6 · $11.8M"
            spark={[1, 2, 2, 3, 4, 4, 5, 5, 6, 6, 6]}
          />
        </section>

        {/* Two-column body */}
        <section style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 48 }}>

          {/* LEFT — Needs attention */}
          <div>
            <SectionHead title="Needs your attention" sub="4 things — sorted by urgency" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <AttentionRow
                accent="red"
                urgency="Today"
                title="Cooling-off expires"
                detail="12 Smith St, Richmond · Sarah & Tom Chen"
                meta="NSW · 5 business days · ends 17:00"
                action="Confirm unconditional"
              />
              <AttentionRow
                accent="amber"
                urgency="Reply needed"
                title={<>Priya asked about strata levy <span style={{ color: 'var(--pg-text-faint)' }}>· 7 Brunswick St</span></>}
                detail={<span style={{ fontStyle: 'italic' }}>&ldquo;What&apos;s the strata levy here? Quarterly?&rdquo;</span>}
                meta="2 hours ago"
                action="Reply"
              />
              <AttentionRow
                accent="amber"
                urgency="Decision"
                title="Holloways: split decision on 18 Park Cres"
                detail="Sarah Interested · Tom Need more info"
                meta="Auction Saturday — 3 days away"
                action="Open deal"
              />
              <AttentionRow
                accent="gray"
                urgency="Nudge"
                title="Daniel Cho hasn&apos;t logged in for 6 days"
                detail="3 unreviewed properties in his portal"
                meta="Last seen Thursday"
                action="Send reminder"
              />
            </div>
          </div>

          {/* RIGHT — This week */}
          <div>
            <SectionHead title="This week" sub="6 milestones · drag to reorder" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { day: 'Tue', date: '23', title: 'Cooling-off expires', sub: '12 Smith St, Richmond · Chen', state: 'Today', highlight: true },
                { day: 'Wed', date: '24', title: 'Pre-settlement inspection', sub: '47 Domain Rd · Holloway · 4pm', state: 'Tomorrow' },
                { day: 'Fri', date: '26', title: 'Auction · 14 Park St', sub: 'Webb · guide $1.6M · on-site 11am', state: 'In 3 days' },
                { day: 'Mon', date: '29', title: 'Finance clause deadline', sub: '8 Erin St · Anand', state: 'In 6 days' },
                { day: 'Wed', date: '31', title: 'Settlement · 22 Oak Ave', sub: 'Cho · $1.62M · PEXA ready', state: 'In 8 days' },
                { day: 'Fri', date: '02 Jun', title: 'Building & pest review', sub: '203/55 Coventry St · Webb', state: 'In 10 days' },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, flexShrink: 0, textAlign: 'right', paddingTop: 1 }}>
                    <div style={{ fontFamily: 'var(--pg-font-display)', fontSize: 18, fontWeight: 600, lineHeight: 1, color: m.highlight ? 'var(--pg-text)' : 'var(--pg-text-dim)' }}>{m.date}</div>
                    <div style={{ fontSize: 10, color: 'var(--pg-text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{m.day}</div>
                  </div>
                  <div style={{ width: 6, marginTop: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch' }}>
                    <div style={{ width: 6, height: 6, borderRadius: 999, background: m.highlight ? 'var(--pg-accent)' : 'var(--pg-text-very-faint)', flexShrink: 0 }} />
                    {i < 5 && <div style={{ flex: 1, width: 1, background: 'var(--pg-border)', marginTop: 6 }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pg-text)' }}>{m.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--pg-text-dim)', marginTop: 2 }}>{m.sub}</div>
                  </div>
                  {m.highlight && (
                    <span className="pg-badge pg-badge-yellow" style={{ fontSize: 10.5 }}>{m.state}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Awaiting client feedback */}
        <section>
          <SectionHead
            title="Awaiting client feedback"
            sub={`${feedbackRows.length} properties shared · 2 still waiting`}
            action={<button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ color: 'var(--pg-text-dim)' }}>Nudge all <Icon name="arrow-right" size={11} /></button>}
          />
          <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '2.2fr 1.6fr 0.8fr 1fr 1fr 0.6fr',
              padding: '10px 16px',
              borderBottom: '1px solid var(--pg-border)',
              fontSize: 10.5, color: 'var(--pg-text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500,
            }}>
              <span>Property</span>
              <span>Client</span>
              <span>Match</span>
              <span style={{ textAlign: 'right' }}>Price</span>
              <span>Status</span>
              <span style={{ textAlign: 'right' }}>Shared</span>
            </div>
            {feedbackRows.map((r, i, a) => (
              <a key={r.id} href={`/properties/${r.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="pg-row" style={{
                  display: 'grid', gridTemplateColumns: '2.2fr 1.6fr 0.8fr 1fr 1fr 0.6fr',
                  padding: '12px 16px',
                  alignItems: 'center',
                  borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none',
                  fontSize: 13,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                    <PropertyThumb seed={r.seed} height={36} style={{ width: 56, flexShrink: 0, borderRadius: 5 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500 }} className="pg-truncate">{r.addr}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--pg-text-dim)' }}>{r.sub}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <div className="pg-avatar pg-avatar-sm">{r.initials}</div>
                    <span className="pg-truncate">{r.client}</span>
                  </div>
                  <div><MatchScore score={r.score} size={28} stroke={2.5} /></div>
                  <div style={{ textAlign: 'right', fontFamily: 'var(--pg-font-mono)' }}>{r.price}</div>
                  <div><span className={`pg-badge ${r.statusClass}`} style={{ fontSize: 11 }}>{r.status}</span></div>
                  <div style={{ textAlign: 'right', color: 'var(--pg-text-faint)', fontSize: 12 }}>{r.shared}</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Signal({ label, value, sub, spark, trendColor = 'var(--pg-text)' }: { label: string; value: string; sub: string; spark: number[]; trendColor?: string }) {
  return (
    <div>
      <div className="pg-label" style={{ marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <div className="pg-display" style={{ fontSize: 40, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
        <Sparkline data={spark} color={trendColor} width={70} height={26} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginTop: 10 }}>{sub}</div>
    </div>
  );
}

function SectionHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16 }}>
      <h2 className="pg-display" style={{ margin: 0, fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap' }}>{title}</h2>
      {sub && <span style={{ fontSize: 12, color: 'var(--pg-text-faint)' }}>{sub}</span>}
      <div style={{ flex: 1 }} />
      {action}
    </div>
  );
}

function AttentionRow({ accent, urgency, title, detail, meta, action }: {
  accent: 'red' | 'amber' | 'gray';
  urgency: string;
  title: React.ReactNode;
  detail: React.ReactNode;
  meta: string;
  action: string;
}) {
  const accentColor = { red: 'var(--pg-red)', amber: 'var(--pg-amber)', gray: 'var(--pg-text-faint)' }[accent];
  return (
    <div className="pg-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--pg-border)' }}>
      <div style={{ width: 6, height: 6, borderRadius: 999, background: accentColor, marginTop: 6, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 10.5, color: accentColor, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{urgency}</span>
          <span style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>{meta}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--pg-text)' }}>{title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--pg-text-dim)', marginTop: 3 }}>{detail}</div>
      </div>
      <button className="pg-btn pg-btn-sm" style={{ flexShrink: 0 }}>{action} <Icon name="arrow-right" size={11} /></button>
    </div>
  );
}
