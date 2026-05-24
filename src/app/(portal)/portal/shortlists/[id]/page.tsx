"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { FeedbackButtons } from "@/components/shared/feedback-buttons";
import { Icon } from "@/components/shared/icon";

type Detail = {
  shortlist: {
    id: string;
    feedback_status: string | null;
    feedback_text: string | null;
  };
  property: {
    canonical_address: string;
    suburb: string;
    state: string;
    bedrooms: number | null;
    bathrooms: number | null;
    car_spaces: number | null;
    listing_price_text: string | null;
    description: string;
    features: string[];
    days_on_market: number | null;
  };
  cma_records: { id: string; comparable_address: string; sale_price: number; sale_date: string; distance_km: number }[];
  risks: { id: string; risk_type: string; risk_level: string; description: string }[];
};

export default function PortalShortlistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    fetch(`/api/portal/shortlists/${id}`)
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => setDetail(payload?.data ?? null));
  }, [id]);

  if (!detail) {
    return <div style={{ padding: 40, color: "var(--pg-text-dim)" }}>Loading property...</div>;
  }

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 32px 64px" }}>
      <a href="/portal" style={{ color: "var(--pg-text-faint)", fontSize: 12, textDecoration: "none" }}>Back to portal</a>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 28, marginTop: 18 }}>
        <div>
          <div style={{ height: 320, borderRadius: 10, background: "linear-gradient(135deg, #ece6d8, #c8d5dc)" }} />
          <h1 className="pg-display" style={{ margin: "24px 0 8px", fontSize: 34 }}>{detail.property.canonical_address}</h1>
          <p style={{ color: "var(--pg-text-dim)", lineHeight: 1.6 }}>{detail.property.description}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            {detail.property.features.map((feature) => <span key={feature} className="pg-badge">{feature}</span>)}
          </div>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="pg-card-flat" style={{ padding: 18 }}>
            <div className="pg-label">Guide</div>
            <div className="pg-display" style={{ fontSize: 34, marginTop: 6 }}>{detail.property.listing_price_text}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 12, color: "var(--pg-text-dim)" }}>
              <span><Icon name="bed" size={13} /> {detail.property.bedrooms} bed</span>
              <span><Icon name="bath" size={13} /> {detail.property.bathrooms} bath</span>
              <span><Icon name="car" size={13} /> {detail.property.car_spaces} car</span>
            </div>
          </div>

          <div className="pg-card-flat" style={{ padding: 18 }}>
            <h2 className="pg-display" style={{ margin: "0 0 14px", fontSize: 18 }}>Your feedback</h2>
            <FeedbackButtons
              shortlistId={detail.shortlist.id}
              initialStatus={detail.shortlist.feedback_status ?? "new"}
              initialText={detail.shortlist.feedback_text ?? ""}
            />
          </div>

          <div className="pg-card-flat" style={{ padding: 18 }}>
            <h2 className="pg-display" style={{ margin: "0 0 12px", fontSize: 18 }}>CMA</h2>
            {detail.cma_records.map((record) => (
              <div key={record.id} style={{ padding: "9px 0", borderBottom: "1px solid var(--pg-border)" }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{record.comparable_address}</div>
                <div style={{ color: "var(--pg-text-dim)", fontSize: 12 }}>${record.sale_price.toLocaleString("en-AU")} · {record.sale_date} · {record.distance_km}km</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
