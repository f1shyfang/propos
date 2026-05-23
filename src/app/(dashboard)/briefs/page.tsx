import { db } from '@/lib/db';
import { buyerBriefsTable } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { TopBar } from '@/components/shared/top-bar';
import { Icon } from '@/components/shared/icon';

export const dynamic = 'force-dynamic';

function formatBudget(min: number | null, max: number | null): string {
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (max) return `up to ${fmt(max)}`;
  return '—';
}

export default async function BriefsPage() {
  const briefs = await db.select().from(buyerBriefsTable).orderBy(desc(buyerBriefsTable.createdAt));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar
        eyebrow={`${briefs.length} active brief${briefs.length !== 1 ? 's' : ''}`}
        title="Buyer Briefs"
        actions={
          <a href="/briefs/new" className="pg-btn pg-btn-accent">
            <Icon name="plus" size={13} />New brief
          </a>
        }
      />

      <div style={{ padding: '24px 32px', flex: 1 }}>
        {briefs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--pg-text-dim)' }}>
            <Icon name="users" size={40} color="var(--pg-text-very-faint)" />
            <div style={{ fontSize: 16, marginTop: 16, fontWeight: 500 }}>No briefs yet</div>
            <div style={{ fontSize: 13, marginTop: 6, color: 'var(--pg-text-faint)' }}>Create your first buyer brief to start matching properties.</div>
            <a href="/briefs/new" className="pg-btn pg-btn-accent" style={{ display: 'inline-flex', marginTop: 20 }}>
              <Icon name="plus" size={13} />New brief
            </a>
          </div>
        ) : (
          <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 0.8fr 0.8fr 0.6fr',
              padding: '10px 16px', borderBottom: '1px solid var(--pg-border)',
              fontSize: 10.5, color: 'var(--pg-text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              <span>Client</span><span>Budget</span><span>Suburbs</span>
              <span>Status</span><span>Type</span><span style={{ textAlign: 'right' }}>Created</span>
            </div>
            {briefs.map((b, i, a) => {
              const suburbs = (b.suburbs as string[]) ?? [];
              const types = (b.propertyTypes as string[]) ?? [];
              return (
                <a key={b.id} href={`/briefs/${b.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="pg-row" style={{
                    display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 0.8fr 0.8fr 0.6fr',
                    padding: '14px 16px', alignItems: 'center', fontSize: 13,
                    borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none',
                  }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{b.clientName}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--pg-text-dim)' }}>{b.email}</div>
                    </div>
                    <div className="pg-mono" style={{ fontSize: 12 }}>{formatBudget(b.budgetMin, b.budgetMax)}</div>
                    <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>
                      {suburbs.slice(0, 2).join(', ')}{suburbs.length > 2 ? ` +${suburbs.length - 2}` : ''}
                    </div>
                    <div>
                      <span className={`pg-badge ${b.status === 'searching' ? 'pg-badge-green pg-badge-dot' : ''}`} style={{ fontSize: 11 }}>
                        {b.status ?? 'searching'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>
                      {types.slice(0, 2).join(', ') || '—'}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--pg-text-faint)' }}>
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—'}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
