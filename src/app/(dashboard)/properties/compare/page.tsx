import { Icon } from '@/components/shared/icon';
import { MatchScore } from '@/components/shared/match-score';
import { PropertyThumb } from '@/components/shared/property-thumb';
import { demoProperties, demoRisks } from '@/lib/demo-data';
import Link from 'next/link';

export default async function ComparePropertiesPage({ searchParams }: { searchParams: Promise<{ ids?: string, brief_id?: string }> }) {
  const sp = await searchParams;
  const idsParam = sp.ids ?? '';
  const briefId = sp.brief_id ?? 'brief-sarah';
  const ids = idsParam.split(',').filter(Boolean).slice(0, 3);

  if (!ids.length) {
    return (
      <div className="p-10 text-center text-[var(--pg-text-dim)]">
        <Icon name="grid" size={40} color="var(--pg-text-very-faint)" />
        <div className="text-base mt-[14px] font-medium">No properties to compare</div>
        <div className="text-[13px] mt-1.5">Select properties from a brief&apos;s match list to compare them here.</div>
        <Link href="/briefs" className="pg-btn inline-flex mt-4">Go to Briefs</Link>
      </div>
    );
  }

  // Map demo data to the schema format expected by this component
  const properties = demoProperties.filter(p => ids.includes(p.id)).map(p => ({
    ...p,
    canonicalAddress: p.canonical_address,
    images: [p.main_image_url],
    parkingSpaces: p.car_spaces,
    landSize: (p as any).land_size ?? 0,
    days: (p as any).days_on_market ?? 14,
    propertyType: (p as any).property_type ?? 'House',
    listingPrice: p.listing_price,
    overallPerc: 75 + (p.bedrooms * 5),
  }));
  
  if (properties.length === 0) {
    return (
      <div className="p-10 text-center text-[var(--pg-text-dim)]">
        <div className="text-base mt-[14px] font-medium">Properties not found</div>
        <Link href="/briefs" className="pg-btn inline-flex mt-4">Go to Briefs</Link>
      </div>
    );
  }

  // Fetch risks
  const risks = demoRisks.filter(r => ids.includes(r.property_id)).map(r => ({
    propertyId: r.property_id,
    riskType: r.risk_type,
    riskLevel: r.risk_level,
    description: r.description
  }));

  // Combine data
  const validItems = properties.map(p => {
    return {
      property: p,
      risks: risks.filter(r => r.propertyId === p.id)
    }
  });

  // Calculate dynamic risk status per property
  const riskCategories = [
    { type: 'flood', label: 'Flood (1-in-100yr)' },
    { type: 'bushfire', label: 'Bushfire BAL' },
    { type: 'heritage', label: 'Heritage overlay' },
    { type: 'zoning', label: 'Zoning constraints' },
  ];

  const riskRows = riskCategories.map(cat => ({
    label: cat.label,
    values: validItems.map(item => {
      const risk = item.risks.find(r => r.riskType === cat.type);
      if (!risk) return 'Clear';
      return `${risk.riskLevel.charAt(0).toUpperCase() + risk.riskLevel.slice(1)} risk`;
    }),
  }));

  return (
    <div className="min-h-full">
      <div className="py-4 px-8 border-b border-[var(--pg-border)] flex items-center gap-4">
        <Link href="/properties" className="text-[var(--pg-text-faint)] text-[12px] no-underline flex items-center gap-1">
          <Icon name="chevron-left" size={11} />Back
        </Link>
        <h1 className="pg-display m-0 text-xl font-semibold">Side-by-Side Comparison</h1>
        <span className="text-[12px] text-[var(--pg-text-faint)]">{validItems.length} propert{validItems.length === 1 ? 'y' : 'ies'}</span>
      </div>

      <div className="py-6 px-8 overflow-x-auto">
        <div className={`grid gap-4 min-w-[700px]`} style={{ gridTemplateColumns: `200px repeat(${validItems.length}, 1fr)` }}>
          <div />
          {validItems.map((item, i) => {
            const p = item.property;
            const score = p.overallPerc ?? (75 + (i * 5) % 20);
            return (
              <div key={p.id} className="pg-card p-0 overflow-hidden flex flex-col">
                <PropertyThumb seed={i} height={160} style={{ borderRadius: 0 }} imageUrl={p.images?.[0] ?? ''} />
                <div className="px-4 py-[14px] flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold pg-truncate">{p.canonicalAddress}</div>
                      <div className="text-[12px] text-[var(--pg-text-dim)]">{p.suburb}, {p.state}</div>
                    </div>
                    <MatchScore score={score} size={32} stroke={3} />
                  </div>
                  <div className="pg-display text-[22px] font-semibold mt-2.5">
                    {p.listingPriceText}
                  </div>
                  <div className="flex gap-3 mt-2 text-[12.5px] text-[var(--pg-text-dim)] flex-1">
                    <span className="flex items-center gap-[3px]"><Icon name="bed" size={11} />{p.bedrooms}</span>
                    <span className="flex items-center gap-[3px]"><Icon name="bath" size={11} />{p.bathrooms}</span>
                    <span className="flex items-center gap-[3px]"><Icon name="car" size={11} />{p.parkingSpaces}</span>
                  </div>
                  <div className="mt-3">
                    <Link href={`/properties/${p.id}`} className="pg-btn pg-btn-sm w-full justify-center">
                      View full details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <CompareSection title="Key Stats">
          {[
            { l: 'Property type', vals: validItems.map(item => item.property.propertyType || '—') },
            { l: 'Bedrooms', vals: validItems.map(item => item.property.bedrooms?.toString() || '—') },
            { l: 'Bathrooms', vals: validItems.map(item => item.property.bathrooms?.toString() || '—') },
            { l: 'Car spaces', vals: validItems.map(item => item.property.parkingSpaces?.toString() || '—') },
            { l: 'Land size', vals: validItems.map(item => item.property.landSize ? `${item.property.landSize}m²` : '—') },
            { l: 'Days on market', vals: validItems.map(item => item.property.days?.toString() || '—') },
          ].map(r => <CompareRow key={r.l} label={r.l} values={r.vals} cols={validItems.length} />)}
        </CompareSection>

        <CompareSection title="Risk Overlay">
          {riskRows.map(r => (
            <CompareRow key={r.label} label={r.label} values={r.values} cols={validItems.length}
              renderVal={(v) => (
                <span className="flex items-center gap-[5px]">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.startsWith('Clear') ? 'bg-[var(--pg-green)]' : 'bg-[var(--pg-amber)]'}`} />
                  {v}
                </span>
              )} />
          ))}
        </CompareSection>

        <CompareSection title="Match Score">
          <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${validItems.length}, 1fr)` }}>
            <div className="flex items-center">
              <span className="text-[12.5px] text-[var(--pg-text-dim)]">Match quality</span>
            </div>
            {validItems.map((item, i) => {
              const p = item.property;
              const score = p.overallPerc ?? (75 + (i * 5) % 20);

              return (
                <div key={i} className="flex items-center gap-3">
                  <MatchScore score={score} size={36} stroke={3} />
                  <div className="text-[12px] text-[var(--pg-text-dim)]">
                    {score >= 80 ? 'Strong match' :
                      score >= 65 ? 'Good match' : 'Partial match'}
                  </div>
                </div>
              );
            })}
          </div>
        </CompareSection>
      </div>
    </div>
  );
}

function CompareSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--pg-text-faint)] mb-3">{title}</div>
      <div className="pg-card-flat overflow-hidden">{children}</div>
    </div>
  );
}

function CompareRow({ label, values, cols, renderVal }: {
  label: string; values: string[]; cols: number;
  renderVal?: (v: string) => React.ReactNode;
}) {
  return (
    <div className="grid gap-4 py-[11px] px-4 border-b border-[var(--pg-border)] text-[13px] items-center" style={{ gridTemplateColumns: `200px repeat(${cols}, 1fr)` }}>
      <div className="text-[12.5px] text-[var(--pg-text-dim)]">{label}</div>
      {values.map((v, i) => (
        <div key={i}>{renderVal ? renderVal(v) : v}</div>
      ))}
    </div>
  );
}
