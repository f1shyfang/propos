"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/shared/icon";

type Document = {
  id: number;
  filename: string;
  tag: string | null;
  fileSize: number | null;
  createdAt: string;
  propertyAddress: string | null;
  dealStatus: string | null;
};

export default function PortalDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/documents")
      .then((res) => (res.ok ? res.json() : { documents: [] }))
      .then((data) => setDocuments(data.documents ?? []))
      .finally(() => setLoading(false));
  }, []);

  function formatBytes(bytes: number | null) {
    if (!bytes) return "Unknown size";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 32px 64px" }}>
      <div style={{ marginBottom: 30 }}>
        <div className="pg-label">Document Vault</div>
        <h1 className="pg-display" style={{ margin: "8px 0 0", fontSize: 38 }}>Your Documents</h1>
        <p style={{ color: "var(--pg-text-dim)", maxWidth: 620, marginTop: 12 }}>
          Access contracts, inspection reports, and other important files shared by your agent.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 40, color: "var(--pg-text-dim)" }}>Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="pg-card" style={{ padding: 40, textAlign: "center", color: "var(--pg-text-dim)" }}>
          No documents have been shared with you yet.
        </div>
      ) : (
        <div className="pg-card-flat" style={{ overflow: "hidden" }}>
          {documents.map((doc, i, a) => (
            <div key={doc.id} style={{ 
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', 
              borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--pg-bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="file-text" size={20} color="var(--pg-text-faint)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }} className="pg-truncate">{doc.filename}</div>
                <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginTop: 4, display: 'flex', gap: 12 }}>
                  <span>{doc.tag ?? 'Other'}</span>
                  <span>&bull;</span>
                  <span>{doc.propertyAddress ?? 'General'}</span>
                  <span>&bull;</span>
                  <span>{new Date(doc.createdAt).toLocaleDateString('en-AU')}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--pg-text-faint)', whiteSpace: 'nowrap' }}>
                {formatBytes(doc.fileSize)}
              </div>
              <button className="pg-btn pg-btn-sm" style={{ marginLeft: 16 }}>
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
