"use client";

import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/shared/icon";

type ShortlistItem = {
  id: string;
  buyer_brief_id: string;
  property_id: string;
  property: {
    id: string;
    canonical_address: string;
    suburb: string;
    state: string;
    bedrooms: number | null;
    bathrooms: number | null;
    car_spaces: number | null;
    listing_price_text: string | null;
  } | null;
  agent_note: string | null;
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

export default function ShortlistsPage() {
  const [briefId, setBriefId] = useState("brief-sarah");
  const [items, setItems] = useState<ShortlistItem[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch(`/api/shortlists?brief_id=${briefId}`);
    if (response.ok) setItems((await response.json()).data);
  }

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("brief_id");
    if (id) setBriefId(id);
  }, []);

  useEffect(() => { void load(); }, [briefId]);

  async function share() {
    setBusy(true);
    await fetch("/api/shortlists/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief_id: briefId }),
    });
    await load();
    setBusy(false);
  }

  const sharedCount = useMemo(() => items.filter((item) => item.shared_at).length, [items]);

  return (
    <div style={{ padding: "28px 32px 48px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 22 }}>
        <div style={{ flex: 1 }}>
          <h1 className="pg-display" style={{ margin: 0, fontSize: 30 }}>Shortlist</h1>
          <p style={{ margin: "6px 0 0", color: "var(--pg-text-dim)" }}>
            {items.length} curated rows · {sharedCount} shared with client
          </p>
        </div>
        <a className="pg-btn" href={`/briefs/${briefId}/matches`}>Back to matches</a>
        <button className="pg-btn pg-btn-primary" disabled={busy || items.length === 0} onClick={share}>
          <Icon name="send" size={13} />{busy ? "Sharing..." : "Share with Sarah"}
        </button>
      </div>

      <div className="pg-card-flat" style={{ overflow: "hidden" }}>
        {items.map((item, index) => (
          <div key={item.id} className="pg-row" style={{
            display: "grid",
            gridTemplateColumns: "2fr 0.8fr 0.8fr 1.4fr auto",
            gap: 16,
            alignItems: "center",
            padding: "15px 16px",
            borderBottom: index < items.length - 1 ? "1px solid var(--pg-border)" : "none",
          }}>
            <div>
              <div style={{ fontWeight: 600 }}>{item.property?.canonical_address ?? item.property_id}</div>
              <div style={{ color: "var(--pg-text-dim)", fontSize: 12 }}>
                {item.property?.suburb}, {item.property?.state}
              </div>
            </div>
            <span className="pg-mono" style={{ fontSize: 12 }}>{item.property?.listing_price_text}</span>
            <span className={`pg-badge ${item.shared_at ? "pg-badge-blue" : ""}`}>{item.shared_at ? "Shared" : "Unshared"}</span>
            <div>
              <span className={`pg-badge ${item.feedback_status ? statusClass[item.feedback_status] : ""}`}>
                {item.feedback_status?.replace(/_/g, " ") ?? "Awaiting feedback"}
              </span>
              {item.feedback_text && <div style={{ fontSize: 12, color: "var(--pg-text-dim)", marginTop: 6 }}>&ldquo;{item.feedback_text}&rdquo;</div>}
            </div>
            <a className="pg-btn pg-btn-sm" href={`/properties/${item.property_id}`}>View</a>
          </div>
        ))}
      </div>
    </div>
  );
}
