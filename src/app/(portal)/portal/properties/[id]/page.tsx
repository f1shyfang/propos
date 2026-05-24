"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@/components/shared/icon";
import { FeedbackButtonGroup, FeedbackStatus } from "@/components/portal/feedback-button-group";

export default function PortalPropertyPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/portal/shortlists/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => setData(payload?.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFeedback = async (status: FeedbackStatus, comment: string) => {
    setSaving(true);
    try {
      await fetch(`/api/portal/shortlists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, comment }),
      });
      // Optionally reload data or just show success state
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading property details...</div>;
  if (!data) return <div style={{ padding: 40 }}>Property not found.</div>;

  const { property, shortlist } = data;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 32px 64px" }}>
      
      <button 
        onClick={() => router.push("/portal")} 
        className="pg-btn pg-btn-ghost" 
        style={{ marginBottom: 24, paddingLeft: 0, fontWeight: 600 }}
      >
        <Icon name="chevron-left" size={16} /> Back to Dashboard
      </button>

      <div className="pg-card" style={{ overflow: "hidden" }}>
        
        {/* Photo Gallery Hero */}
        <div style={{ height: 400, background: "#f0f0f0", position: "relative" }}>
          {property.images?.[0] ? (
            <img src={property.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Property" />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pg-text-dim)" }}>
              No Images Available
            </div>
          )}
        </div>

        {/* Content Body */}
        <div style={{ padding: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, marginBottom: 24 }}>
            <div>
              <h1 className="pg-display" style={{ margin: "0 0 8px", fontSize: 28 }}>{property.canonical_address}</h1>
              <div style={{ fontSize: 16, color: "var(--pg-text-dim)" }}>{property.suburb}, {property.state} {property.postcode}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="pg-mono" style={{ fontSize: 24, fontWeight: 600 }}>{property.listing_price_text}</div>
              <div style={{ marginTop: 8, display: "flex", gap: 16, color: "var(--pg-text-dim)", justifyContent: "flex-end", fontSize: 14 }}>
                <span><Icon name="bed" size={14} /> {property.bedrooms}</span>
                <span><Icon name="bath" size={14} /> {property.bathrooms}</span>
                <span><Icon name="car" size={14} /> {property.car_spaces}</span>
              </div>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid var(--pg-border)", margin: "24px 0" }} />

          {shortlist.agent_note && (
            <div style={{ background: "var(--pg-bg-2)", padding: 24, borderRadius: 12, marginBottom: 32 }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--pg-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="users" size={16} /> Why Jess chose this property
              </h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{shortlist.agent_note}</p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 40, marginBottom: 40 }}>
            <div>
              <h2 className="pg-display" style={{ fontSize: 20, marginBottom: 16 }}>About this property</h2>
              <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {property.description ?? "No description provided."}
              </p>
            </div>
            
            <div>
              <h2 className="pg-display" style={{ fontSize: 20, marginBottom: 16 }}>Key Stats</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
                <li style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--pg-text-dim)" }}>Property Type</span> <span>{property.property_type ?? "N/A"}</span></li>
                <li style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--pg-text-dim)" }}>Land Size</span> <span>{property.land_area_sqm ? `${property.land_area_sqm} sqm` : "N/A"}</span></li>
                <li style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--pg-text-dim)" }}>Floor Area</span> <span>{property.floor_area_sqm ? `${property.floor_area_sqm} sqm` : "N/A"}</span></li>
                <li style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--pg-text-dim)" }}>Days on Market</span> <span>{property.days_on_market ?? "N/A"}</span></li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* Feedback Strip Anchored at Bottom */}
      <div style={{ position: "sticky", bottom: 24, marginTop: 40, zIndex: 10 }}>
        <FeedbackButtonGroup 
          initialStatus={shortlist.feedback_status as FeedbackStatus} 
          initialComment="" 
          onFeedback={handleFeedback} 
        />
        {saving && <div style={{ position: "absolute", top: -20, right: 10, fontSize: 12, color: "var(--pg-text-dim)" }}>Saving...</div>}
      </div>

    </div>
  );
}
