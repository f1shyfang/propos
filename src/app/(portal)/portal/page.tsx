"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/shared/icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SettlementTimeline } from "@/components/shared/settlement-timeline";

type ShortlistItem = {
  id: string;
  property: {
    id: string;
    canonical_address: string;
    suburb: string;
    state: string;
    bedrooms: number | null;
    bathrooms: number | null;
    car_spaces: number | null;
    listing_price_text: string | null;
    images: string[] | null;
  } | null;
  agent_note: string | null;
  feedback_status: "interested" | "need_more_info" | "not_for_me" | null;
};

const statusClass = {
  interested: "pg-badge-green",
  need_more_info: "pg-badge-amber",
  not_for_me: "pg-badge-red",
};

export default function PortalDashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestUrl, setSuggestUrl] = useState("");
  const [submittingSuggest, setSubmittingSuggest] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  // Dummy milestones for demonstration
  const dummyMilestones = [
    { id: 1, title: 'Contract Exchange', dayOffset: 0, dueDate: '2026-05-20', completedAt: '2026-05-20', status: 'completed' },
    { id: 2, title: 'Finance Approval', dayOffset: 14, dueDate: '2026-06-03', completedAt: null, status: 'pending' },
    { id: 3, title: 'Building & Pest', dayOffset: 14, dueDate: '2026-06-03', completedAt: null, status: 'pending' },
    { id: 4, title: 'Pre-settlement Inspection', dayOffset: 40, dueDate: '2026-06-29', completedAt: null, status: 'pending' },
    { id: 5, title: 'Settlement', dayOffset: 42, dueDate: '2026-07-01', completedAt: null, status: 'pending' },
  ];

  useEffect(() => {
    Promise.all([
      fetch("/api/portal/shortlists").then(r => r.ok ? r.json() : { items: [] }),
      fetch("/api/portal/activity").then(r => r.ok ? r.json() : { actions: [] }),
      fetch("/api/portal/documents").then(r => r.ok ? r.json() : { documents: [] })
    ]).then(([shortlistRes, activityRes, docRes]) => {
      setItems(shortlistRes.items ?? []);
      setActivities((activityRes.activity ?? []).slice(0, 3));
      setDocuments((docRes.documents ?? []).slice(0, 3));
    }).finally(() => setLoading(false));
  }, []);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) {
        toast.error("You can compare up to 3 properties at a time.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestUrl) return;
    setSubmittingSuggest(true);
    try {
      const res = await fetch("/api/portal/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: suggestUrl })
      });
      if (res.ok) {
        toast.success("Property suggested successfully!");
        setSuggestUrl("");
      } else {
        toast.error("Failed to suggest property");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to suggest property");
    } finally {
      setSubmittingSuggest(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 md:py-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-10 border-b border-[var(--pg-border)] pb-6">
        <div className="w-16 h-16 rounded-full bg-[var(--pg-primary)] flex items-center justify-center text-white text-2xl font-bold shadow-sm">
          S
        </div>
        <div className="flex-1">
          <h1 className="pg-display text-3xl font-semibold m-0">Welcome back, Sarah.</h1>
          <p className="text-[var(--pg-text-dim)] mt-1">
            Jess has shared new properties for you to review.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <a href="tel:1300000000" className="w-10 h-10 rounded-full bg-[var(--pg-bg-2)] flex items-center justify-center hover:bg-[var(--pg-bg-offset)] transition-colors duration-200 shadow-sm" title="Call Agent">
            <Icon name="phone" size={16} />
          </a>
          <a href="mailto:agent@demo.com" className="w-10 h-10 rounded-full bg-[var(--pg-bg-2)] flex items-center justify-center hover:bg-[var(--pg-bg-offset)] transition-colors duration-200 shadow-sm" title="Email Agent">
            <Icon name="mail" size={16} />
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-12">
        
        {/* My Properties */}
        <section>
          <div className="flex justify-between items-end mb-5">
            <h2 className="pg-display text-2xl font-semibold m-0">My Properties</h2>
            {compareIds.length > 0 && (
              <button 
                className="pg-btn pg-btn-primary shadow-sm hover:shadow-md transition-all duration-200" 
                onClick={() => router.push(`/portal/compare?ids=${compareIds.join(',')}`)}
              >
                <Icon name="grid" size={14} /> Compare {compareIds.length} properties
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="text-[var(--pg-text-dim)] animate-pulse">Loading properties...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, index) => {
                const isComparing = compareIds.includes(item.id);
                return (
                  <div key={item.id} className={`pg-card relative flex flex-col hover:shadow-md transition-all duration-200 ${isComparing ? "border-[var(--pg-primary)] ring-1 ring-[var(--pg-primary)]" : ""}`}>
                    {/* Compare Button positioned absolutely on the card (un-nested from link) */}
                    <button 
                      onClick={() => toggleCompare(item.id)}
                      className={`absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all duration-200 ${isComparing ? "bg-[var(--pg-primary)] text-white" : "bg-white/90 text-[var(--pg-text)] hover:bg-white"}`}
                    >
                      {isComparing ? <Icon name="check" size={12} /> : <Icon name="plus" size={12} />}
                      {isComparing ? "Comparing" : "Compare"}
                    </button>

                    <Link href={`/portal/properties/${item.id}`} className="flex flex-col flex-1 text-inherit no-underline">
                      <div className="h-40 flex items-center justify-center font-semibold text-black/30 bg-gray-200 overflow-hidden relative">
                        {item.property?.images?.[0] ? <img src={item.property.images[0]} className="w-full h-full object-cover" alt="" /> : "Property"}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                      
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold pg-truncate">{item.property?.canonical_address}</div>
                            <div className="text-xs text-[var(--pg-text-dim)] mt-0.5">{item.property?.suburb}, {item.property?.state}</div>
                          </div>
                          <span className="pg-mono text-xs font-medium">{item.property?.listing_price_text}</span>
                        </div>
                        <div className="flex gap-3 mt-3 text-xs text-[var(--pg-text-dim)]">
                          <span className="flex items-center gap-1"><Icon name="bed" size={11} /> {item.property?.bedrooms}</span>
                          <span className="flex items-center gap-1"><Icon name="bath" size={11} /> {item.property?.bathrooms}</span>
                          <span className="flex items-center gap-1"><Icon name="car" size={11} /> {item.property?.car_spaces}</span>
                        </div>
                        {item.agent_note && (
                          <div className="mt-3 p-3 bg-[var(--pg-bg-2)] rounded-lg">
                            <div className="text-[10px] uppercase font-bold text-[var(--pg-text-dim)] mb-1 tracking-wider">Why Jess chose this</div>
                            <p className="text-xs text-[var(--pg-text)] m-0 leading-relaxed line-clamp-2">{item.agent_note}</p>
                          </div>
                        )}
                        <div className="mt-auto pt-4">
                          <span className={`pg-badge ${item.feedback_status ? statusClass[item.feedback_status] : ""}`}>
                            {item.feedback_status ? item.feedback_status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Awaiting feedback"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
              
              {items.length === 0 && !loading && (
                <div className="col-span-full p-10 text-center text-[var(--pg-text-dim)] border border-dashed border-[var(--pg-border)] rounded-xl">
                  No properties shortlisted yet.
                </div>
              )}
            </div>
          )}
        </section>

        {/* Suggest a Property */}
        <section className="pg-card p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex-1">
              <h3 className="m-0 mb-1 text-lg font-medium">Suggest a Property</h3>
              <p className="m-0 text-sm text-[var(--pg-text-dim)]">Found something you like on Domain or RealEstate.com.au? Paste the link here.</p>
            </div>
            <form onSubmit={handleSuggest} className="flex flex-col sm:flex-row gap-3 flex-[2] w-full">
              <input 
                type="url" 
                placeholder="https://..." 
                className="pg-input flex-1 shadow-sm" 
                value={suggestUrl}
                onChange={e => setSuggestUrl(e.target.value)}
                required
              />
              <button type="submit" className="pg-btn pg-btn-primary shadow-sm hover:shadow-md transition-all duration-200" disabled={submittingSuggest}>
                {submittingSuggest ? "Sending..." : "Send to Agent"}
              </button>
            </form>
          </div>
        </section>

        {/* Two Columns: Timeline, Activity and Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          
          <section className="pg-card p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h3 className="m-0 text-lg font-medium">Settlement Timeline</h3>
            </div>
            <SettlementTimeline milestones={dummyMilestones} readOnly />
          </section>

          <div className="flex flex-col gap-6 md:gap-8">
            <section className="pg-card p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h3 className="m-0 text-lg font-medium">Recent Activity</h3>
                <Link href="/portal/activity" className="text-xs font-semibold text-[var(--pg-primary)] hover:underline">View all</Link>
              </div>
              {activities.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {activities.map((a, idx) => (
                    <div key={idx} className={`flex gap-3 items-start pb-4 ${idx < activities.length - 1 ? 'border-b border-[var(--pg-border)]' : ''}`}>
                      <div className="mt-1 text-[var(--pg-text-dim)] bg-[var(--pg-bg-2)] w-6 h-6 rounded flex items-center justify-center"><Icon name="list" size={12} /></div>
                      <div>
                        <div className="text-sm text-[var(--pg-text)] font-medium">{a.description || a.actionType}</div>
                        <div className="text-xs text-[var(--pg-text-faint)] mt-1">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                 <div className="text-sm text-[var(--pg-text-dim)] p-4 bg-[var(--pg-bg-offset)] rounded-lg text-center">No recent activity.</div>
              )}
            </section>

            <section className="pg-card p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h3 className="m-0 text-lg font-medium">My Documents</h3>
                <Link href="/portal/documents" className="text-xs font-semibold text-[var(--pg-primary)] hover:underline">View all</Link>
              </div>
              {documents.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {documents.map((d, idx) => (
                    <div key={idx} className={`flex gap-3 items-center pb-4 ${idx < documents.length - 1 ? 'border-b border-[var(--pg-border)]' : ''}`}>
                      <div className="w-10 h-10 rounded-lg bg-[var(--pg-bg-2)] flex items-center justify-center text-[var(--pg-text-dim)]">
                        <Icon name="file" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium pg-truncate">{d.name}</div>
                        <div className="text-xs text-[var(--pg-text-dim)] mt-0.5">{d.type}</div>
                      </div>
                      {/* Fixed: removed e.preventDefault() so downloads work natively */}
                      <a href={`/api/docs/download?id=${d.id || idx}`} download className="pg-btn pg-btn-sm pg-btn-ghost flex items-center hover:bg-[var(--pg-bg-offset)] transition-colors duration-200" onClick={() => toast.success(`Downloading ${d.name}...`)}>
                        <Icon name="arrow-down" size={14} /> Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                 <div className="text-sm text-[var(--pg-text-dim)] p-4 bg-[var(--pg-bg-offset)] rounded-lg text-center">No documents available.</div>
              )}
            </section>
          </div>
        </div>

      </div>
    </div>
  );
}
