import { TopBar } from "@/components/shared/top-bar";
import { Icon } from "@/components/shared/icon";
import { DashboardFeedback } from "@/components/shared/dashboard-feedback";
import { demoBriefs, demoProperties, demoShortlists, getMatchScores } from "@/lib/demo-data";

export default function DashboardPage() {
  const topMatches = getMatchScores()
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 5);
  const sharedCount = demoShortlists.filter((item) => item.shared_at).length;

  return (
    <div>
      <TopBar
        eyebrow="Hackathon MVP"
        title="Propos agent dashboard"
        actions={
          <>
            <a className="pg-btn" href="/briefs/new"><Icon name="plus" size={13} />New brief</a>
            <a className="pg-btn pg-btn-primary" href="/briefs/brief-sarah/matches">
              <Icon name="sparkles" size={13} />Run Sarah demo
            </a>
          </>
        }
      />

      <div style={{ padding: "24px 32px 40px", display: "flex", flexDirection: "column", gap: 28 }}>
        <section style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18 }}>
          <Metric label="Active briefs" value={String(demoBriefs.length)} detail="Seeded buyer requirements" />
          <Metric label="Properties" value={String(demoProperties.length)} detail="Sydney demo corpus" />
          <Metric label="Shared rows" value={String(sharedCount)} detail="Visible in Sarah's portal" />
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <SectionHead title="Best matches" sub="Precomputed seed scores" />
            <div className="pg-card-flat" style={{ overflow: "hidden" }}>
              {topMatches.map((match, index) => {
                const property = demoProperties.find((item) => item.id === match.property_id);
                const brief = demoBriefs.find((item) => item.id === match.brief_id);
                if (!property || !brief) return null;
                return (
                  <a key={match.id} href={`/briefs/${brief.id}/matches`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="pg-row" style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 16,
                      padding: "14px 16px",
                      borderBottom: index < topMatches.length - 1 ? "1px solid var(--pg-border)" : "none",
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{property.canonical_address}</div>
                        <div style={{ fontSize: 12, color: "var(--pg-text-dim)", marginTop: 2 }}>
                          {brief.client_name} · {property.suburb}
                        </div>
                      </div>
                      <span className="pg-badge pg-badge-green">{match.match_score}%</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <SectionHead title="Demo path" sub="The story to rehearse" />
            <div className="pg-card-flat" style={{ padding: 18 }}>
              {["Create brief", "Review ranked matches", "Add to shortlist", "Share with Sarah", "Sarah leaves feedback", "Agent sees refresh"].map((item, index) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0" }}>
                  <span className="pg-badge pg-badge-yellow">{index + 1}</span>
                  <span style={{ fontSize: 13 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <DashboardFeedback />
      </div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="pg-card-flat" style={{ padding: 18 }}>
      <div className="pg-label">{label}</div>
      <div className="pg-display" style={{ fontSize: 38, marginTop: 8 }}>{value}</div>
      <div style={{ color: "var(--pg-text-dim)", fontSize: 12, marginTop: 4 }}>{detail}</div>
    </div>
  );
}

function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
      <h2 className="pg-display" style={{ margin: 0, fontSize: 18 }}>{title}</h2>
      <span style={{ color: "var(--pg-text-faint)", fontSize: 12 }}>{sub}</span>
    </div>
  );
}
