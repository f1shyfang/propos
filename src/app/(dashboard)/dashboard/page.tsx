import { TopBar } from "@/components/shared/top-bar";
import { Icon } from "@/components/shared/icon";
import { DashboardFeedback } from "@/components/shared/dashboard-feedback";
import { demoProperties } from "@/lib/demo-data";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const liveBriefsCount = 4;
  const livePropsCount = demoProperties.length;
  const liveSharedCount = 12;

  const topMatches = [
    {
      id: "match-1",
      briefId: "brief-sarah",
      address: "123 Coastal Way",
      suburb: "Bondi",
      clientName: "Sarah M.",
      score: 95,
    },
    {
      id: "match-2",
      briefId: "brief-sarah",
      address: "45 Ocean View Dr",
      suburb: "Bondi",
      clientName: "Sarah M.",
      score: 88,
    },
    {
      id: "match-3",
      briefId: "brief-sarah",
      address: "88 Park Avenue",
      suburb: "Paddington",
      clientName: "Sarah M.",
      score: 82,
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--pg-surface)]">
      <TopBar
        eyebrow="Agent Overview"
        title="Today's Dashboard"
        actions={
          <>
            <Link href="/briefs/new" className="pg-btn shadow-sm hover:shadow-md transition-all duration-200 no-underline">
              <Icon name="plus" size={13} /> New brief
            </Link>
          </>
        }
      />

      <div className="flex-1 p-6 md:p-8 xl:p-10 flex flex-col gap-8 overflow-auto pg-scroll">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Metric label="Active briefs" value={String(liveBriefsCount)} detail="Live database queries" />
          <Metric label="Properties" value={String(livePropsCount)} detail="Live properties tracked" />
          <Metric label="Shared rows" value={String(liveSharedCount)} detail="Visible in client portals" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col">
            <SectionHead title="Best matches" sub="Top shortlisted properties across all active briefs" />
            <div className="pg-card p-0 overflow-hidden shadow-sm flex-1">
              {topMatches.map((match, index) => {
                return (
                  <Link key={match.id} href={`/briefs/${match.briefId}/matches`} className="block no-underline text-inherit hover:bg-[var(--pg-bg-offset)] transition-colors duration-150">
                    <div className={`grid grid-cols-[1fr_auto] gap-4 p-4 items-center ${index < topMatches.length - 1 ? "border-b border-[var(--pg-border)]" : ""}`}>
                      <div className="min-w-0 pr-4">
                        <div className="text-[13.5px] font-semibold pg-truncate">{match.address}</div>
                        <div className="text-xs text-[var(--pg-text-dim)] mt-1">
                          {match.clientName} · {match.suburb}
                        </div>
                      </div>
                      <span className="pg-badge pg-badge-green font-medium shadow-sm">{match.score ?? 0}%</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col">
            <SectionHead title="Recent Notifications" sub="System alerts and team updates" />
            <div className="pg-card p-4 shadow-sm flex-1 flex flex-col justify-center items-center text-center">
              <Icon name="bell" size={32} className="text-[var(--pg-text-very-faint)] mb-3" />
              <p className="text-[13.5px] font-medium text-[var(--pg-text-dim)] m-0">No new notifications</p>
              <p className="text-xs text-[var(--pg-text-faint)] mt-1 mb-0">You're all caught up for today.</p>
            </div>
          </div>
        </section>

        <section className="mt-2">
          <SectionHead title="Client Feedback" sub="Live responses from client portals" />
          <DashboardFeedback />
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="pg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="text-xs font-semibold text-[var(--pg-text-dim)] uppercase tracking-wider">{label}</div>
      <div className="pg-display text-4xl mt-3 mb-1">{value}</div>
      <div className="text-xs text-[var(--pg-text-faint)]">{detail}</div>
    </div>
  );
}

function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <h2 className="pg-display m-0 text-[19px] font-semibold">{title}</h2>
      <span className="text-xs text-[var(--pg-text-faint)] hidden sm:inline-block">{sub}</span>
    </div>
  );
}
