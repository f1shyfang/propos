"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

import { Icon } from "@/components/shared/icon";

type Match = {
  id: string;
  brief_id: string;
  property: {
    id: string;
    canonical_address: string;
    suburb: string;
    state: string;
    property_type: string;
    bedrooms: number | null;
    bathrooms: number | null;
    car_spaces: number | null;
    listing_price_text: string | null;
  };
  match_score: number;
  match_reasons: {
    budget_fit: { score: number; detail: string };
    suburb_match: { score: number; detail: string };
    property_type_match: { score: number; detail: string };
    must_haves_pass: boolean;
    deal_breakers_triggered: string[];
  };
};

type ShortlistItem = { id: string; property_id: string; shared_at: string | null; feedback_status: string | null };

export default function BriefMatchesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);

  const load = useCallback(async () => {
    const [matchesRes, shortlistRes] = await Promise.all([
      fetch(`/api/briefs/${params.id}/matches?min_score=1&limit=25`),
      fetch(`/api/shortlists?brief_id=${params.id}`),
    ]);
    if (matchesRes.ok) setMatches((await matchesRes.json()).data);
    if (shortlistRes.ok) setShortlist((await shortlistRes.json()).data);
  }, [params.id]);

  useEffect(() => { void load(); }, [load]);

  async function addToShortlist(propertyId: string) {
    setBusy(propertyId);
    const response = await fetch("/api/shortlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief_id: params.id, property_id: propertyId }),
    });
    if (response.status !== 409) await load();
    setBusy(null);
  }

  async function share() {
    setShareBusy(true);
    await fetch("/api/shortlists/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief_id: params.id }),
    });
    await load();
    setShareBusy(false);
    router.refresh();
  }

  const shortlistedIds = new Set(shortlist.map((item) => item.property_id));

  return (
    <div style={{ padding: "28px 32px 48px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 22 }}>
        <div style={{ flex: 1 }}>
          <a href="/briefs" style={{ color: "var(--pg-text-faint)", fontSize: 12, textDecoration: "none" }}>Briefs</a>
          <h1 className="pg-display" style={{ margin: "6px 0 0", fontSize: 30 }}>Ranked matches</h1>
          <p style={{ margin: "6px 0 0", color: "var(--pg-text-dim)" }}>Sorted by deterministic seed score against the buyer brief.</p>
        </div>
        <a className="pg-btn" href={`/shortlists?brief_id=${params.id}`}>Open shortlist</a>
        <button className="pg-btn pg-btn-primary" disabled={shareBusy || shortlist.length === 0} onClick={share}>
          <Icon name="send" size={13} />{shareBusy ? "Sharing..." : `Share ${shortlist.length}`}
        </button>
      </div>

      <div className="pg-card-flat" style={{ overflow: "hidden" }}>
        {matches.map((match, index) => {
          const inShortlist = shortlistedIds.has(match.property.id);
          return (
            <div key={match.id} className="pg-row" style={{
              display: "grid",
              gridTemplateColumns: "2fr 0.8fr 0.8fr 1.2fr auto",
              gap: 16,
              alignItems: "center",
              padding: "15px 16px",
              borderBottom: index < matches.length - 1 ? "1px solid var(--pg-border)" : "none",
            }}>
              <a href={`/properties/${match.property.id}`} style={{ textDecoration: "none", color: "inherit", minWidth: 0 }}>
                <div style={{ fontWeight: 600 }} className="pg-truncate">{match.property.canonical_address}</div>
                <div style={{ fontSize: 12, color: "var(--pg-text-dim)" }}>
                  {match.property.suburb}, {match.property.state} · {match.property.bedrooms}/{match.property.bathrooms}/{match.property.car_spaces}
                </div>
              </a>
              <span className={`pg-badge ${match.match_score >= 80 ? "pg-badge-green" : match.match_score >= 65 ? "pg-badge-amber" : ""}`}>{match.match_score}%</span>
              <span className="pg-mono" style={{ fontSize: 12 }}>{match.property.listing_price_text}</span>
              <span style={{ color: "var(--pg-text-dim)", fontSize: 12 }}>{match.match_reasons.budget_fit.detail}</span>
              <button className={`pg-btn pg-btn-sm ${inShortlist ? "pg-btn-accent" : ""}`} disabled={busy === match.property.id || inShortlist} onClick={() => addToShortlist(match.property.id)}>
                <Icon name="bookmark" size={11} />{inShortlist ? "Saved" : "Shortlist"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
