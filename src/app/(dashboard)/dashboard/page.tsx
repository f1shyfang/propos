import { db } from '@/lib/db';
import { propertiesTable, dealsTable, buyerBriefsTable } from '@/lib/db/schema';
import { count } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { TopBar } from '@/components/shared/top-bar';
import { Icon } from '@/components/shared/icon';
import { Sparkline } from '@/components/shared/sparkline';
import { DashboardFeedback } from '@/components/shared/dashboard-feedback';
import {
  computePipelineSummary,
  getAttentionItems,
  formatPipelineValue,
  type DealSummaryRow,
} from '@/lib/deals';

export default async function DashboardPage() {
  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  const [propCount, dealRows] = await Promise.all([
    db.select({ n: count() }).from(propertiesTable),
    db
      .select({
        id: dealsTable.id,
        status: dealsTable.status,
        price: propertiesTable.price,
        offerAmount: dealsTable.offerAmount,
        settlementDate: dealsTable.settlementDate,
        exchangeDate: dealsTable.exchangeDate,
        priority: dealsTable.priority,
        address: propertiesTable.address,
        suburb: propertiesTable.suburb,
        state: propertiesTable.state,
        isAuction: dealsTable.isAuction,
        clientName: buyerBriefsTable.clientName,
      })
      .from(dealsTable)
      .leftJoin(propertiesTable, eq(dealsTable.propertyId, propertiesTable.id))
      .leftJoin(buyerBriefsTable, eq(dealsTable.briefId, buyerBriefsTable.id)),
  ]);

  const totalProps = Number(propCount[0]?.n ?? 0);

  const summaryRows: DealSummaryRow[] = dealRows.map((d) => ({
    id: d.id,
    status: d.status ?? 'suggested',
    price: d.price,
    offerAmount: d.offerAmount,
    settlementDate: d.settlementDate?.toISOString() ?? null,
    exchangeDate: d.exchangeDate?.toISOString() ?? null,
    priority: d.priority ?? 'standard',
    address: d.address,
    suburb: d.suburb,
    clientName: d.clientName,
    state: d.state,
    isAuction: d.isAuction ?? false,
  }));

  const pipeline = computePipelineSummary(summaryRows);
  const attentionItems = getAttentionItems(summaryRows);
  const activeStages = Object.keys(pipeline.stageCounts).filter(
    (s) => !['settled', 'lost', 'withdrawn'].includes(s) && pipeline.stageCounts[s] > 0,
  ).length;

  const settledThisMonth = summaryRows.filter((d) => {
    if (d.status !== 'settled' || !d.settlementDate) return false;
    const sd = new Date(d.settlementDate);
    const now = new Date();
    return sd.getMonth() === now.getMonth() && sd.getFullYear() === now.getFullYear();
  });

  return (
    <div style={{ padding: 0 }}>
      <TopBar
        eyebrow={today}
        title="Good morning."
        actions={
          <>
            <a href="/briefs/new" className="pg-btn"><Icon name="plus" size={13} />Add brief</a>
            <a href="/pipeline" className="pg-btn pg-btn-primary">
              <Icon name="pipeline" size={13} />
              {pipeline.activeCount} in pipeline
            </a>
          </>
        }
      />

      <div style={{ padding: '8px 32px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36, paddingBottom: 24, borderBottom: '1px solid var(--pg-border)' }}>
          <Signal
            label="In pipeline"
            value={formatPipelineValue(pipeline.totalValue)}
            sub={`${pipeline.activeCount} active deal${pipeline.activeCount === 1 ? '' : 's'} across ${activeStages || 0} stages`}
            spark={[Math.max(1, pipeline.activeCount - 4), Math.max(1, pipeline.activeCount - 3), Math.max(1, pipeline.activeCount - 2), Math.max(1, pipeline.activeCount - 1), pipeline.activeCount]}
            trendColor="var(--pg-green)"
          />
          <Signal
            label="Properties tracked"
            value={totalProps > 1000 ? `${(totalProps / 1000).toFixed(1)}K` : String(totalProps)}
            sub={`${dealRows.length} total deal${dealRows.length === 1 ? '' : 's'} recorded`}
            spark={[1, 2, 2, 3, 4, 4, 5, 5, 6, 6, 6]}
          />
          <Signal
            label="Settling this month"
            value={String(settledThisMonth.length)}
            sub={settledThisMonth.length ? formatPipelineValue(settledThisMonth.reduce((s, d) => s + (d.offerAmount ?? d.price ?? 0), 0)) : 'No settlements yet'}
            spark={[0, 0, 1, 1, 2, settledThisMonth.length]}
            trendColor="var(--pg-green)"
          />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 48 }}>
          <div>
            <SectionHead
              title="Needs your attention"
              sub={attentionItems.length ? `${attentionItems.length} thing${attentionItems.length === 1 ? '' : 's'} — sorted by urgency` : 'All clear for now'}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {attentionItems.length === 0 ? (
                <div style={{ padding: '24px 0', color: 'var(--pg-text-faint)', fontSize: 13 }}>
                  No urgent pipeline items. Check client feedback below.
                </div>
              ) : (
                attentionItems.slice(0, 6).map((item) => (
                  <AttentionRow
                    key={`${item.type}-${item.dealId}`}
                    accent={item.accent}
                    urgency={item.urgency}
                    title={item.title}
                    detail={item.detail}
                    meta={item.meta}
                    action="Open deal"
                    href={item.href}
                  />
                ))
              )}
            </div>
          </div>

          <div>
            <SectionHead title="Pipeline stages" sub="Live from your deals" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['suggested', 'approved', 'due_diligence', 'offer_made', 'under_contract', 'settled'].map((stage) => (
                <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                  <span style={{ flex: 1, textTransform: 'capitalize' }}>{stage.replace(/_/g, ' ')}</span>
                  <span className="pg-mono" style={{ color: 'var(--pg-text-dim)' }}>
                    {pipeline.stageCounts[stage] ?? 0}
                  </span>
                </div>
              ))}
              <a href="/pipeline" className="pg-btn pg-btn-sm" style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                Open pipeline <Icon name="arrow-right" size={11} />
              </a>
            </div>
          </div>
        </section>

        <DashboardFeedback />
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

function AttentionRow({ accent, urgency, title, detail, meta, action, href }: {
  accent: 'red' | 'amber' | 'gray';
  urgency: string;
  title: React.ReactNode;
  detail: React.ReactNode;
  meta: string;
  action: string;
  href: string;
}) {
  const accentColor = { red: 'var(--pg-red)', amber: 'var(--pg-amber)', gray: 'var(--pg-text-faint)' }[accent];
  return (
    <div className="pg-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--pg-border)' }}>
      <div style={{ width: 6, height: 6, borderRadius: 999, background: accentColor, marginTop: 6, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 10.5, color: accentColor, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{urgency}</span>
          {meta && (
            <>
              <span style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>{meta}</span>
            </>
          )}
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--pg-text)' }}>{title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--pg-text-dim)', marginTop: 3 }}>{detail}</div>
      </div>
      <a href={href} className="pg-btn pg-btn-sm" style={{ flexShrink: 0 }}>{action} <Icon name="arrow-right" size={11} /></a>
    </div>
  );
}
