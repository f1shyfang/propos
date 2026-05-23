import { TopBar } from '@/components/shared/top-bar';
import { Icon } from '@/components/shared/icon';
import { MatchScore } from '@/components/shared/match-score';

export default function PipelinePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar
        eyebrow="14 active · $48.2M in pipeline"
        title="Pipeline"
        actions={
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--pg-text-dim)', padding: '6px 11px', border: '1px solid var(--pg-border)', borderRadius: 6 }}>
              <Icon name="filter" size={12} />
              <span>All agents</span>
              <Icon name="chevron-down" size={11} color="var(--pg-text-faint)" />
            </div>
            <div style={{ display: 'flex', background: 'var(--pg-surface)', border: '1px solid var(--pg-border)', borderRadius: 6, padding: 2 }}>
              <button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ background: 'var(--pg-bg-2)' }}><Icon name="grid" size={12} />Board</button>
              <button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ color: 'var(--pg-text-dim)' }}><Icon name="list" size={12} />Table</button>
            </div>
            <button className="pg-btn pg-btn-primary"><Icon name="plus" size={13} />New deal</button>
          </>
        }
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }} className="pg-scroll">
        <div style={{ display: 'flex', gap: 14, height: '100%', minHeight: 600 }}>
          <KCol title="Suggested" count={4} value="$8.4M" muted>
            <DealCard seed={5} addr="112 Wellington Pde" sub="East Melbourne" client="Holloway" price="$2.45M" match={87} source="match" days="2d" />
            <DealCard seed={1} addr="14 Park St" sub="South Yarra" client="Webb · Investor" price="$1.6M guide" days="3d" tag={{ l: 'Auction Sat', c: 'pg-badge-blue' }} source="client" />
            <DealCard seed={2} addr="3/22 Acland St" sub="St Kilda" client="Anand" price="$895K" match={64} days="4d" source="match" />
            <DealCard seed={4} addr="55 Auburn Rd" sub="Hawthorn" client="Chen" price="$1.32M" days="5d" source="manual" />
          </KCol>

          <KCol title="Approved" count={3} value="$6.1M" dot="var(--pg-blue)">
            <DealCard seed={0} addr="14/82 Riversdale Rd" sub="Hawthorn" client="Chen" price="$1.42M" match={87} days="1d" priority="high" cobuyer />
            <DealCard seed={3} addr="18 Park Cres" sub="Caulfield North" client="Holloway" price="$1.85M" match={91} days="2d" tag={{ l: 'Auction Sat', c: 'pg-badge-blue' }} cobuyer />
            <DealCard seed={2} addr="89 Smith St" sub="Collingwood" client="Webb" price="$1.05M" match={74} days="6d" />
          </KCol>

          <KCol title="Due diligence" count={3} value="$9.8M" dot="var(--pg-amber)">
            <DealCard seed={1} addr="7 Brunswick St" sub="Fitzroy" client="Anand" price="$985K" days="8d" ddProgress={{ done: 5, total: 8 }} priority="urgent" />
            <DealCard seed={4} addr="22/199 Toorak Rd" sub="South Yarra" client="Cho" price="$1.62M" days="4d" ddProgress={{ done: 3, total: 8 }} tag={{ l: 'Strata', c: 'pg-badge-purple' }} />
            <DealCard seed={0} addr="38 Tennyson St" sub="Elwood" client="Chen" price="$2.18M" days="11d" ddProgress={{ done: 7, total: 8 }} />
          </KCol>

          <KCol title="Offer made" count={3} value="$5.4M" dot="var(--pg-purple)">
            <DealCard seed={3} addr="47 Domain Rd" sub="South Yarra" client="Holloway" price="$2.80M offer" days="3d"
              offerState={{ l: 'Negotiating', c: 'pg-badge-amber', history: ['$2.65M sent', '$2.95M counter', '$2.80M sent'] }}
              priority="urgent"
            />
            <DealCard seed={2} addr="5 Erin St" sub="Richmond" client="Anand" price="$1.16M offer" days="1d"
              offerState={{ l: 'Sent', c: 'pg-badge-blue', history: ['$1.16M · awaiting response'] }}
            />
            <DealCard seed={1} addr="14 Park St" sub="South Yarra" client="Webb" price="$1.55M" days="0d"
              offerState={{ l: 'Draft', c: 'pg-badge-gray', history: ['Auction registration pending'] }}
            />
          </KCol>

          <KCol title="Under contract" count={3} value="$11.8M" dot="var(--pg-green)">
            <DealCard seed={0} addr="12 Smith St" sub="Richmond" client="Chen" price="$1.42M" days="5d"
              cooling={{ s: 'NSW · 2d left', c: 'pg-badge-amber' }}
              pexa="ready"
              nextMs="Pre-settle insp · 16 Jun"
            />
            <DealCard seed={4} addr="22 Oak Ave" sub="Kew" client="Cho" price="$1.62M" days="12d"
              cooling={{ s: 'Expired ✓', c: 'pg-badge-gray' }}
              pexa="settling"
              nextMs="Settlement · 31 May"
              priority="high"
            />
            <DealCard seed={3} addr="9 Coppin St" sub="Cremorne" client="Webb" price="$1.18M" days="22d"
              cooling={{ s: 'Expired ✓', c: 'pg-badge-gray' }}
              pexa="exception"
              nextMs="Conveyancer follow-up"
            />
          </KCol>

          <KCol title="Settled" count={2} value="$3.7M · 30d" dot="var(--pg-green)" muted>
            <DealCard seed={5} addr="18 Brunswick Rd" sub="Brunswick" client="Park" price="$1.48M" days="Settled 18 May" settled />
            <DealCard seed={2} addr="103/188 Whiteman" sub="Docklands" client="Liu" price="$725K" days="Settled 12 May" settled />
          </KCol>
        </div>
      </div>
    </div>
  );
}

function KCol({ title, count, value, dot, muted, children }: {
  title: string; count: number; value: string; dot?: string; muted?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="pg-kcol" style={{ opacity: muted ? 0.75 : 1 }}>
      <div style={{ padding: '11px 12px 9px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {dot && <div style={{ width: 6, height: 6, borderRadius: 999, background: dot, flexShrink: 0 }} />}
        <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.02em' }}>{title}</div>
        <span style={{ fontSize: 11, fontFamily: 'var(--pg-font-mono)', color: 'var(--pg-text-faint)' }}>{count}</span>
        <div style={{ flex: 1 }} />
        <span className="pg-mono" style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>{value}</span>
        <button className="pg-btn pg-btn-ghost pg-btn-icon pg-btn-sm" style={{ color: 'var(--pg-text-faint)' }}><Icon name="plus" size={11} /></button>
      </div>
      <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', flex: 1 }} className="pg-scroll">
        {children}
      </div>
    </div>
  );
}

function DealCard({ seed, addr, sub, client, price, match, source, cobuyer, ddProgress, offerState, cooling, pexa, nextMs, tag, priority, settled, days }: {
  seed: number; addr: string; sub: string; client: string; price: string;
  match?: number; source?: string; cobuyer?: boolean;
  ddProgress?: { done: number; total: number };
  offerState?: { l: string; c: string; history: string[] };
  cooling?: { s: string; c: string };
  pexa?: 'ready' | 'settling' | 'exception';
  nextMs?: string; tag?: { l: string; c: string };
  priority?: 'high' | 'urgent'; settled?: boolean; days?: string;
}) {
  const pexaConfig = {
    ready: { l: 'PEXA ready', c: 'pg-badge-green' },
    settling: { l: 'Settling', c: 'pg-badge-blue' },
    exception: { l: 'Exception', c: 'pg-badge-red' },
  };
  const pexaInfo = pexa ? pexaConfig[pexa] : null;
  seed; // used implicitly for visual variation

  return (
    <div style={{
      background: 'var(--pg-surface)',
      border: '1px solid var(--pg-border)',
      borderRadius: 8,
      padding: 10,
      position: 'relative',
      opacity: settled ? 0.7 : 1,
    }}>
      {priority && (
        <div style={{ position: 'absolute', top: 8, right: 8, width: 5, height: 5, borderRadius: 999, background: priority === 'urgent' ? 'var(--pg-red)' : 'var(--pg-amber)' }} />
      )}
      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{addr}</div>
      <div style={{ fontSize: 11, color: 'var(--pg-text-dim)' }}>{sub}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span className="pg-mono" style={{ fontSize: 12, fontWeight: 500, color: settled ? 'var(--pg-text-dim)' : 'var(--pg-text)' }}>{price}</span>
        <div style={{ flex: 1 }} />
        {match && <MatchScore score={match} size={22} stroke={2.2} />}
      </div>
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--pg-border)', fontSize: 11, color: 'var(--pg-text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="users" size={10} color="var(--pg-text-faint)" />
        <span style={{ flex: 1 }}>{client}</span>
        {cobuyer && <span style={{ color: 'var(--pg-green)' }}>✓✓</span>}
      </div>
      {(source || tag) && (
        <div style={{ marginTop: 7, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {source === 'match' && <span className="pg-badge pg-badge-yellow" style={{ fontSize: 10, padding: '1px 6px' }}><Icon name="sparkles" size={9} />AI match</span>}
          {source === 'client' && <span className="pg-badge pg-badge-blue" style={{ fontSize: 10, padding: '1px 6px' }}>Client sent</span>}
          {source === 'manual' && <span className="pg-badge" style={{ fontSize: 10, padding: '1px 6px' }}>Manual</span>}
          {tag && <span className={`pg-badge ${tag.c}`} style={{ fontSize: 10, padding: '1px 6px' }}>{tag.l}</span>}
        </div>
      )}
      {ddProgress && (
        <div style={{ marginTop: 9 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--pg-text-dim)', marginBottom: 4 }}>
            <span>Checklist</span>
            <span className="pg-mono">{ddProgress.done}/{ddProgress.total}</span>
          </div>
          <div style={{ height: 4, background: 'var(--pg-bg-2)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${(ddProgress.done / ddProgress.total) * 100}%`, height: '100%', background: 'var(--pg-amber)' }} />
          </div>
        </div>
      )}
      {offerState && (
        <div style={{ marginTop: 9, padding: 8, background: 'var(--pg-bg-2)', borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`pg-badge ${offerState.c}`} style={{ fontSize: 10, padding: '1px 6px' }}>{offerState.l}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--pg-text-faint)' }}>{offerState.history.length} round{offerState.history.length > 1 ? 's' : ''}</span>
          </div>
          {offerState.history.slice(-2).map((h, i, a) => (
            <div key={i} style={{ marginTop: 4, fontSize: 10.5, fontFamily: 'var(--pg-font-mono)', color: i === a.length - 1 ? 'var(--pg-text)' : 'var(--pg-text-dim)' }}>
              <span style={{ color: 'var(--pg-text-faint)' }}>{i === a.length - 1 ? '└' : '├'}</span> {h}
            </div>
          ))}
        </div>
      )}
      {cooling && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5 }}>
          <span style={{ color: 'var(--pg-text-faint)' }}>Cool-off</span>
          <span className={`pg-badge ${cooling.c}`} style={{ fontSize: 10, padding: '1px 6px' }}>{cooling.s}</span>
        </div>
      )}
      {pexaInfo && (
        <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5 }}>
          <span style={{ color: 'var(--pg-text-faint)' }}>PEXA</span>
          <span className={`pg-badge ${pexaInfo.c}`} style={{ fontSize: 10, padding: '1px 6px' }}>{pexaInfo.l}</span>
        </div>
      )}
      {nextMs && (
        <div style={{ marginTop: 9, paddingTop: 8, borderTop: '1px dashed var(--pg-border)', fontSize: 11, color: 'var(--pg-text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="arrow-right" size={10} color="var(--pg-accent)" />
          <span>{nextMs}</span>
        </div>
      )}
      {days && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--pg-border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--pg-text-faint)' }}>
          <span className="pg-mono">{days}</span>
          <div style={{ flex: 1 }} />
          <div className="pg-avatar pg-avatar-sm" style={{ width: 18, height: 18, fontSize: 9 }}>JM</div>
        </div>
      )}
    </div>
  );
}
