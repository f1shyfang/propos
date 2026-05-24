import { TopBar } from "@/components/shared/top-bar";
import { Icon } from "@/components/shared/icon";
import { demoBriefs, formatCurrency, getMatchScores } from "@/lib/demo-data";

export default function BriefsPage() {
  return (
    <div>
      <TopBar
        eyebrow={`${demoBriefs.length} active briefs`}
        title="Buyer briefs"
        actions={<a href="/briefs/new" className="pg-btn pg-btn-accent"><Icon name="plus" size={13} />New brief</a>}
      />
      <div style={{ padding: "24px 32px" }}>
        <div className="pg-card-flat" style={{ overflow: "hidden" }}>
          {demoBriefs.map((brief, index) => (
            <a key={brief.id} href={`/briefs/${brief.id}/matches`} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="pg-row" style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr 1fr 0.7fr auto",
                gap: 16,
                padding: "16px",
                alignItems: "center",
                borderBottom: index < demoBriefs.length - 1 ? "1px solid var(--pg-border)" : "none",
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{brief.client_name}</div>
                  <div style={{ color: "var(--pg-text-dim)", fontSize: 12 }}>{brief.finance_status.replace(/_/g, " ")}</div>
                </div>
                <div className="pg-mono" style={{ fontSize: 12 }}>
                  {formatCurrency(brief.budget_min)} - {formatCurrency(brief.budget_max)}
                </div>
                <div style={{ color: "var(--pg-text-dim)", fontSize: 12 }}>{brief.preferred_suburbs.slice(0, 2).join(", ")}</div>
                <span className="pg-badge pg-badge-green">{getMatchScores(brief.id).length} matches</span>
                <Icon name="chevron-right" size={14} color="var(--pg-text-faint)" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
