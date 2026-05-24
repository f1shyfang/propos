"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/shared/top-bar";
import { Icon } from "@/components/shared/icon";
import { toast } from "sonner";

export default function ClientSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portal/suggestions")
      .then(r => r.ok ? r.json() : { suggestions: [] })
      .then(payload => setSuggestions(payload.suggestions ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    const previousStatus = suggestions.find(s => s.id === id)?.status;
    if (!previousStatus) return;

    setUpdatingId(id);
    // Optimistic update
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    try {
      const res = await fetch("/api/portal/suggestions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(status === 'pending' ? "Action undone" : "Status updated");
    } catch (err) {
      // Revert on error
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: previousStatus } : s));
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar eyebrow="Client Feedback" title="Client Suggestions" />
      
      <div style={{ padding: 24, maxWidth: 800 }}>
        <p style={{ color: "var(--pg-text-dim)", marginBottom: 24 }}>
          Properties that your clients have found online and suggested for you to review.
        </p>

        {loading ? (
          <div style={{ color: "var(--pg-text-dim)" }}>Loading suggestions...</div>
        ) : suggestions.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", border: "1px dashed var(--pg-border)", borderRadius: 8, color: "var(--pg-text-dim)" }}>
            <Icon name="inbox" size={32} style={{ opacity: 0.5, marginBottom: 12 }} />
            <div>No suggestions yet.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {suggestions.map((s) => (
              <div key={s.id} className="pg-card" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: updatingId === s.id ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Icon name="users" size={14} /> {s.client_name ?? "Client"}
                  </div>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--pg-primary)", wordBreak: "break-all" }}>
                    {s.url}
                  </a>
                  <div style={{ fontSize: 12, color: "var(--pg-text-faint)", marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>Suggested on {new Date(s.created_at).toLocaleString()}</span>
                    <span>·</span>
                    <span className={`pg-badge ${
                      s.status === 'added_to_shortlist' ? 'pg-badge-green' : 
                      s.status === 'ignored' ? 'pg-badge-red' : 
                      s.status === 'reviewed' ? 'pg-badge-yellow' : ''
                    }`}>
                      {s.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {s.status === 'pending' && (
                    <>
                      <button 
                        className="pg-btn pg-btn-sm" 
                        onClick={() => updateStatus(s.id, 'ignored')}
                        disabled={updatingId === s.id}
                      >
                        Ignore
                      </button>
                      <button 
                        className="pg-btn pg-btn-sm" 
                        onClick={() => updateStatus(s.id, 'reviewed')}
                        disabled={updatingId === s.id}
                      >
                        Mark Reviewed
                      </button>
                      <button 
                        className="pg-btn pg-btn-primary pg-btn-sm" 
                        onClick={() => updateStatus(s.id, 'added_to_shortlist')}
                        disabled={updatingId === s.id}
                      >
                        Add to Shortlist
                      </button>
                    </>
                  )}
                  {s.status !== 'pending' && (
                    <button 
                      className="pg-btn pg-btn-sm" 
                      onClick={() => updateStatus(s.id, 'pending')}
                      disabled={updatingId === s.id}
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
