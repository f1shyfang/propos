"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/shared/icon";

type ActivityItem = {
  id: number;
  actionType: string;
  entityType: string;
  metadata: Record<string, any>;
  createdAt: string;
};

export default function PortalActivityPage() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/activity")
      .then((res) => (res.ok ? res.json() : { activity: [] }))
      .then((data) => setActivity(data.activity ?? []))
      .finally(() => setLoading(false));
  }, []);

  function getActivityIcon(type: string): any {
    if (type.includes("document")) return "file-text";
    if (type.includes("offer") || type.includes("deal")) return "briefcase";
    if (type.includes("shortlist")) return "sparkles";
    return "bell";
  }

  function getActivityText(item: ActivityItem) {
    switch (item.actionType) {
      case 'brief_create': return 'A new deal was created for you to review.';
      case 'document_upload': return 'A new document was uploaded to your vault.';
      case 'status_change': return `Deal status was updated to ${item.metadata?.newStatus ?? 'a new stage'}.`;
      default: return 'A new update occurred on your property search.';
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 32px 64px" }}>
      <div style={{ marginBottom: 40 }}>
        <div className="pg-label">Activity Feed</div>
        <h1 className="pg-display" style={{ margin: "8px 0 0", fontSize: 38 }}>Recent Updates</h1>
        <p style={{ color: "var(--pg-text-dim)", marginTop: 12 }}>
          Timeline of all activity from your buyer&apos;s agent.
        </p>
      </div>

      {loading ? (
        <div style={{ color: "var(--pg-text-dim)" }}>Loading activity...</div>
      ) : activity.length === 0 ? (
        <div className="pg-card" style={{ padding: 40, textAlign: "center", color: "var(--pg-text-dim)" }}>
          No recent activity to display.
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 19, top: 20, bottom: 20, width: 2, background: "var(--pg-border)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {activity.map((item) => (
              <div key={item.id} style={{ display: "flex", gap: 16, position: "relative" }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: 20, background: "var(--pg-bg)", 
                  border: "1px solid var(--pg-border)", display: "flex", alignItems: "center", 
                  justifyContent: "center", zIndex: 1, boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                }}>
                  <Icon name={getActivityIcon(item.actionType)} size={16} color="var(--pg-text-dim)" />
                </div>
                <div className="pg-card-flat" style={{ flex: 1, padding: "16px 20px" }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{getActivityText(item)}</div>
                  <div style={{ fontSize: 12, color: "var(--pg-text-dim)", marginTop: 4 }}>
                    {new Date(item.createdAt).toLocaleString('en-AU', {
                      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
