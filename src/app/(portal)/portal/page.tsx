"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/shared/icon";

type ShortlistItem = {
  id: string;
  property: {
    canonical_address: string;
    suburb: string;
    state: string;
    bedrooms: number | null;
    bathrooms: number | null;
    car_spaces: number | null;
    listing_price_text: string | null;
  } | null;
  agent_note: string | null;
  feedback_status: "interested" | "need_more_info" | "not_for_me" | null;
};

const statusClass = {
  interested: "pg-badge-green",
  need_more_info: "pg-badge-amber",
  not_for_me: "pg-badge-red",
};

export default function PortalPage() {
  const [items, setItems] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/shortlists")
      .then((response) => response.ok ? response.json() : { items: [] })
      .then((payload) => setItems(payload.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 32px 64px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 30 }}>
        <div style={{ flex: 1 }}>
          <div className="pg-label">Private client portal</div>
          <h1 className="pg-display" style={{ margin: "8px 0 0", fontSize: 38 }}>Welcome back, Sarah.</h1>
          <p style={{ color: "var(--pg-text-dim)", maxWidth: 620 }}>
            Jess has shared properties for review. Open each property to inspect the detail and leave structured feedback.
          </p>
        </div>
        <a className="pg-btn" href="/portal/login">Switch account</a>
      </div>

      {loading ? (
        <div style={{ padding: 40, color: "var(--pg-text-dim)" }}>Loading shortlist...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {items.map((item, index) => (
            <a key={item.id} href={`/portal/shortlists/${item.id}`} className="pg-card" style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ height: 160, background: `linear-gradient(135deg, hsl(${index * 44} 30% 88%), hsl(${index * 44 + 20} 28% 77%))`, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(0,0,0,0.35)", fontWeight: 600 }}>
                Property
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }} className="pg-truncate">{item.property?.canonical_address}</div>
                    <div style={{ color: "var(--pg-text-dim)", fontSize: 12 }}>{item.property?.suburb}, {item.property?.state}</div>
                  </div>
                  <span className="pg-mono" style={{ fontSize: 12 }}>{item.property?.listing_price_text}</span>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 10, color: "var(--pg-text-dim)", fontSize: 12 }}>
                  <span><Icon name="bed" size={11} /> {item.property?.bedrooms}</span>
                  <span><Icon name="bath" size={11} /> {item.property?.bathrooms}</span>
                  <span><Icon name="car" size={11} /> {item.property?.car_spaces}</span>
                </div>
                {item.agent_note && (
                  <p style={{ fontSize: 12, color: "var(--pg-text-dim)", lineHeight: 1.5, minHeight: 36 }}>{item.agent_note}</p>
                )}
                <span className={`pg-badge ${item.feedback_status ? statusClass[item.feedback_status] : ""}`}>
                  {item.feedback_status?.replace(/_/g, " ") ?? "Awaiting feedback"}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
