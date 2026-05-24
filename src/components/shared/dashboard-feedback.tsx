"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/shared/icon";

type FeedbackRow = {
  id: string;
  buyer_brief_id: string;
  property_id: string;
  property: {
    canonical_address: string;
    suburb: string;
    state: string;
    listing_price_text: string | null;
  } | null;
  shared_at: string | null;
  feedback_status: "interested" | "need_more_info" | "not_for_me" | null;
  feedback_text: string | null;
  feedback_at: string | null;
};

const statusClass = {
  interested: "pg-badge-green",
  need_more_info: "pg-badge-amber",
  not_for_me: "pg-badge-red",
};

function timeAgo(value: string | null) {
  if (!value) return "not yet";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function DashboardFeedback() {
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const response = await fetch("/api/feedback/poll");
    if (response.ok) {
      const payload = await response.json();
      setItems(payload.data.items);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 3000);
    return () => clearInterval(timer);
  }, []);

  const awaiting = items.filter((item) => !item.feedback_status).length;

  return (
    <section>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14 }}>
        <h2 className="pg-display" style={{ margin: 0, fontSize: 18 }}>Client feedback</h2>
        <span style={{ fontSize: 12, color: "var(--pg-text-faint)" }}>
          {loading ? "Loading..." : `${items.length} shared · ${awaiting} awaiting`}
        </span>
        <div style={{ flex: 1 }} />
        <button className="pg-btn pg-btn-sm" onClick={() => void load()}><Icon name="clock" size={11} />Refresh</button>
      </div>

      <div className="pg-card-flat" style={{ overflow: "hidden" }}>
        {items.length === 0 && !loading ? (
          <div style={{ padding: 24, color: "var(--pg-text-dim)", textAlign: "center" }}>No shared properties yet.</div>
        ) : items.map((item, index) => (
          <div key={item.id} className="pg-row" style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 0.8fr",
            gap: 16,
            alignItems: "center",
            padding: "14px 16px",
            borderBottom: index < items.length - 1 ? "1px solid var(--pg-border)" : "none",
          }}>
            <div>
              <div style={{ fontWeight: 600 }}>{item.property?.canonical_address ?? item.property_id}</div>
              <div style={{ color: "var(--pg-text-dim)", fontSize: 12 }}>{item.property?.suburb}, {item.property?.state}</div>
              {item.feedback_text && <div style={{ color: "var(--pg-text-dim)", fontSize: 12, marginTop: 5 }}>&ldquo;{item.feedback_text}&rdquo;</div>}
            </div>
            <span className="pg-mono" style={{ fontSize: 12 }}>{item.property?.listing_price_text}</span>
            <span className={`pg-badge ${item.feedback_status ? statusClass[item.feedback_status] : ""}`}>
              {item.feedback_status?.replace(/_/g, " ") ?? "Awaiting"}
            </span>
            <span style={{ color: "var(--pg-text-faint)", fontSize: 12, textAlign: "right" }}>{timeAgo(item.feedback_at ?? item.shared_at)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
