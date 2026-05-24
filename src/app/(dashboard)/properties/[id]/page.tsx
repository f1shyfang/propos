import { notFound } from "next/navigation";

import { Icon } from "@/components/shared/icon";
import { demoCMARecords, demoProperties, demoRisks, formatCurrency } from "@/lib/demo-data";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = demoProperties.find((item) => item.id === id);
  if (!property) notFound();

  const cma = demoCMARecords.filter((item) => item.property_id === id);
  const risks = demoRisks.filter((item) => item.property_id === id);

  return (
    <div style={{ padding: "28px 32px 48px", maxWidth: 1120 }}>
      <a href="/properties" style={{ color: "var(--pg-text-faint)", fontSize: 12, textDecoration: "none" }}>Properties</a>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 28, marginTop: 14 }}>
        <div>
          <div style={{ height: 340, borderRadius: 10, background: "linear-gradient(135deg, #e9e3d6, #c5d3da)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(0,0,0,0.35)", fontWeight: 600, textTransform: "capitalize" }}>
            {property.property_type}
          </div>
          <h1 className="pg-display" style={{ margin: "24px 0 8px", fontSize: 34 }}>{property.canonical_address}</h1>
          <p style={{ color: "var(--pg-text-dim)", lineHeight: 1.6 }}>{property.raw_data.description}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            {property.raw_data.features.map((feature) => <span key={feature} className="pg-badge">{feature}</span>)}
          </div>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="pg-card-flat" style={{ padding: 18 }}>
            <div className="pg-label">Guide</div>
            <div className="pg-display" style={{ fontSize: 34, marginTop: 6 }}>{formatCurrency(property.listing_price)}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 12, color: "var(--pg-text-dim)" }}>
              <span><Icon name="bed" size={13} /> {property.bedrooms} bed</span>
              <span><Icon name="bath" size={13} /> {property.bathrooms} bath</span>
              <span><Icon name="car" size={13} /> {property.car_spaces} car</span>
            </div>
          </div>

          <div className="pg-card-flat" style={{ padding: 18 }}>
            <h2 className="pg-display" style={{ margin: "0 0 12px", fontSize: 18 }}>Risk badges</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {risks.length ? risks.map((risk) => (
                <span key={risk.id} className={`pg-badge ${risk.risk_level === "high" ? "pg-badge-red" : risk.risk_level === "medium" ? "pg-badge-amber" : "pg-badge-green"}`}>
                  {risk.risk_type}: {risk.risk_level}
                </span>
              )) : <span style={{ color: "var(--pg-text-dim)", fontSize: 13 }}>No major seeded risks.</span>}
            </div>
          </div>

          <div className="pg-card-flat" style={{ padding: 18 }}>
            <h2 className="pg-display" style={{ margin: "0 0 12px", fontSize: 18 }}>Comparable sales</h2>
            {cma.map((record) => (
              <div key={record.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--pg-border)" }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{record.comparable_address}</div>
                <div style={{ color: "var(--pg-text-dim)", fontSize: 12 }}>{formatCurrency(record.sale_price)} · {record.sale_date} · {record.distance_km}km</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
