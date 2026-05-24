"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/shared/icon";

export function OfferLetterGenerator({ dealId }: { dealId: string }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/generate-offer`);
      if (res.ok) {
        const data = await res.json();
        setText(data.text);
      }
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    if (dealId && !text) {
      generate();
    }
  }, [dealId, generate, text]);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="pg-card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--pg-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="file-text" size={16} color="var(--pg-accent)" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Offer Letter</span>
        </div>
        <div style={{ display: "flex", gap: 8 }} className="no-print">
          <button onClick={handlePrint} disabled={!text} className="pg-btn pg-btn-sm pg-btn-ghost">
            <Icon name="printer" size={14} /> Print
          </button>
          <button onClick={generate} disabled={loading} className="pg-btn pg-btn-sm pg-btn-ghost">
            <Icon name="sparkles" size={14} /> Regenerate
          </button>
          <button onClick={handleCopy} disabled={!text} className="pg-btn pg-btn-sm pg-btn-primary">
            <Icon name={copied ? "check" : "file"} size={14} /> {copied ? "Copied" : "Copy text"}
          </button>
        </div>
      </div>
      
      <div className="print-area" style={{ flex: 1, padding: 20, background: "var(--pg-bg-2)", overflowY: "auto" }}>
        {loading ? (
          <div style={{ color: "var(--pg-text-dim)", textAlign: "center", marginTop: 40 }}>Generating offer letter...</div>
        ) : (
          <>
            <textarea
              className="no-print"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                width: "100%",
                height: "100%",
                minHeight: 300,
                background: "transparent",
                border: "none",
                resize: "none",
                outline: "none",
                fontFamily: "var(--pg-font-mono)",
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--pg-text)",
              }}
            />
            <div className="print-only" style={{ display: "none", whiteSpace: "pre-wrap", fontFamily: "serif", fontSize: 12, lineHeight: 1.5 }}>
              {text}
            </div>
          </>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            padding: 40px !important;
            background: white !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
