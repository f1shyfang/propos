"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/shared/icon";

const propertyTypes = ["apartment", "unit", "townhouse", "house"];
const suburbOptions = ["Surry Hills", "Newtown", "Pyrmont", "Redfern", "Randwick", "Lane Cove", "Marrickville", "Parramatta"];
const mustHaveOptions = ["natural light", "public transport", "internal laundry", "balcony", "parking", "backyard"];
const dealBreakerOptions = ["ground floor", "main road", "no balcony", "cladding", "high strata"];

export default function NewBriefPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_name: "Sarah Chen & Tom Williams",
    budget_min: 800000,
    budget_max: 1100000,
    property_types: ["apartment"],
    preferred_suburbs: ["Surry Hills", "Newtown", "Pyrmont"],
    min_bedrooms: 2,
    min_bathrooms: 1,
    parking: "nice_to_have",
    must_haves: ["natural light", "public transport", "internal laundry"],
    deal_breakers: ["ground floor", "main road", "no balcony"],
  });

  function toggle(key: "property_types" | "preferred_suburbs" | "must_haves" | "deal_breakers", value: string) {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch("/api/briefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(payload.error?.message ?? "Could not create brief");
      return;
    }

    router.push(`/briefs/${payload.data.id}/matches`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 920, margin: "0 auto", padding: "40px 24px 80px" }}>
      <a href="/briefs" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--pg-text-faint)", fontSize: 12, textDecoration: "none", marginBottom: 20 }}>
        <Icon name="chevron-left" size={12} />Back to briefs
      </a>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <h1 className="pg-display" style={{ margin: 0, fontSize: 30 }}>New buyer brief</h1>
          <p style={{ margin: "8px 0 0", color: "var(--pg-text-dim)" }}>Single-page MVP intake, tuned for the demo flow.</p>
        </div>
        <button className="pg-btn pg-btn-accent" disabled={saving}>
          {saving ? "Creating..." : "Create brief"}
        </button>
      </div>

      {error && <div className="pg-card-flat" style={{ padding: 14, color: "var(--pg-red)", marginBottom: 18 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Section title="Client">
          <label className="pg-label">Client name</label>
          <input className="pg-input" value={form.client_name} onChange={(event) => setForm((current) => ({ ...current, client_name: event.target.value }))} />
        </Section>

        <Section title="Budget">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="pg-label">Minimum</label>
              <input className="pg-input" type="number" value={form.budget_min} onChange={(event) => setForm((current) => ({ ...current, budget_min: Number(event.target.value) }))} />
            </div>
            <div>
              <label className="pg-label">Maximum</label>
              <input className="pg-input" type="number" value={form.budget_max} onChange={(event) => setForm((current) => ({ ...current, budget_max: Number(event.target.value) }))} />
            </div>
          </div>
        </Section>

        <Section title="Property Requirements">
          <ChipGroup values={propertyTypes} selected={form.property_types} onToggle={(value) => toggle("property_types", value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
            <NumberField label="Beds" value={form.min_bedrooms} onChange={(value) => setForm((current) => ({ ...current, min_bedrooms: value }))} />
            <NumberField label="Baths" value={form.min_bathrooms} onChange={(value) => setForm((current) => ({ ...current, min_bathrooms: value }))} />
            <div>
              <label className="pg-label">Parking</label>
              <select className="pg-input" value={form.parking} onChange={(event) => setForm((current) => ({ ...current, parking: event.target.value }))}>
                <option value="required">Required</option>
                <option value="nice_to_have">Nice to have</option>
                <option value="not_needed">Not needed</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="Locations">
          <ChipGroup values={suburbOptions} selected={form.preferred_suburbs} onToggle={(value) => toggle("preferred_suburbs", value)} />
        </Section>

        <Section title="Must-Haves">
          <ChipGroup values={mustHaveOptions} selected={form.must_haves} onToggle={(value) => toggle("must_haves", value)} />
        </Section>

        <Section title="Deal-Breakers">
          <ChipGroup values={dealBreakerOptions} selected={form.deal_breakers} onToggle={(value) => toggle("deal_breakers", value)} />
        </Section>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pg-card-flat" style={{ padding: 18 }}>
      <h2 className="pg-display" style={{ margin: "0 0 16px", fontSize: 18 }}>{title}</h2>
      {children}
    </section>
  );
}

function ChipGroup({ values, selected, onToggle }: { values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onToggle(value)}
          className={`pg-btn pg-btn-sm ${selected.includes(value) ? "pg-btn-accent" : ""}`}
          style={{ textTransform: "capitalize" }}
        >
          {value.replace(/_/g, " ")}
        </button>
      ))}
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <label className="pg-label">{label}</label>
      <input className="pg-input" type="number" min={0} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}
