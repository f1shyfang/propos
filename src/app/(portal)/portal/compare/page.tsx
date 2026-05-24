"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Icon } from "@/components/shared/icon";
import { FeedbackButtonGroup, FeedbackStatus } from "@/components/portal/feedback-button-group";
import Link from "next/link";

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ids = searchParams?.get("ids")?.split(",") ?? [];
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(ids.map(id => 
      fetch(`/api/portal/shortlists/${id}`).then(r => r.ok ? r.json() : null)
    )).then(results => {
      setData(results.filter(r => r !== null).map(r => r.data));
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  const handleFeedback = async (id: string, status: FeedbackStatus, comment: string) => {
    await fetch(`/api/portal/shortlists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, comment }),
    });
  };

  if (loading) return <div style={{ padding: 40 }}>Loading comparison...</div>;
  if (data.length === 0) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <p>No properties selected for comparison.</p>
      <button onClick={() => router.push("/portal")} className="pg-btn pg-btn-primary">Back to Dashboard</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px 64px" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <button 
            onClick={() => router.push("/portal")} 
            className="pg-btn pg-btn-ghost" 
            style={{ paddingLeft: 0, fontWeight: 600, marginBottom: 8 }}
          >
            <Icon name="chevron-left" size={16} /> Back to Dashboard
          </button>
          <h1 className="pg-display" style={{ margin: 0, fontSize: 32 }}>Compare Properties</h1>
        </div>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: `repeat(${data.length}, 1fr)`, 
        gap: 24,
        overflowX: "auto"
      }}>
        {data.map(({ property, shortlist }, idx) => (
          <div key={shortlist.id} className="pg-card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            
            {/* Photo Hero */}
            <div style={{ height: 200, background: "#f0f0f0", position: "relative" }}>
              {property.images?.[0] ? (
                <img src={property.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Property" />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pg-text-dim)" }}>
                  No Image
                </div>
              )}
            </div>

            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
              {/* Header Info */}
              <div style={{ marginBottom: 16 }}>
                <Link href={`/portal/properties/${shortlist.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: 18 }} className="pg-truncate">{property.canonical_address}</h3>
                </Link>
                <div style={{ fontSize: 13, color: "var(--pg-text-dim)" }}>{property.suburb}, {property.state}</div>
                <div className="pg-mono" style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>{property.listing_price_text}</div>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: 12, color: "var(--pg-text-dim)", fontSize: 13, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--pg-border)" }}>
                <span><Icon name="bed" size={14} /> {property.bedrooms}</span>
                <span><Icon name="bath" size={14} /> {property.bathrooms}</span>
                <span><Icon name="car" size={14} /> {property.car_spaces}</span>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12, fontSize: 13, flex: 1 }}>
                <li style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--pg-text-dim)" }}>Property Type</span> <span style={{fontWeight:500}}>{property.property_type ?? "—"}</span></li>
                <li style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--pg-text-dim)" }}>Land Size</span> <span style={{fontWeight:500}}>{property.land_area_sqm ? `${property.land_area_sqm} sqm` : "—"}</span></li>
                <li style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--pg-text-dim)" }}>Floor Area</span> <span style={{fontWeight:500}}>{property.floor_area_sqm ? `${property.floor_area_sqm} sqm` : "—"}</span></li>
                <li style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--pg-text-dim)" }}>Days on Market</span> <span style={{fontWeight:500}}>{property.days_on_market ?? "—"}</span></li>
              </ul>

              {shortlist.agent_note && (
                <div style={{ background: "var(--pg-bg-2)", padding: 16, borderRadius: 8, marginTop: 24, marginBottom: 24 }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 600, color: "var(--pg-text-dim)", marginBottom: 8 }}>Agent Notes</div>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{shortlist.agent_note}</p>
                </div>
              )}

              {/* Action */}
              <div style={{ marginTop: "auto", paddingTop: 24 }}>
                <FeedbackButtonGroup 
                  initialStatus={shortlist.feedback_status as FeedbackStatus} 
                  initialComment="" 
                  onFeedback={(status, comment) => handleFeedback(shortlist.id, status, comment)} 
                />
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}
