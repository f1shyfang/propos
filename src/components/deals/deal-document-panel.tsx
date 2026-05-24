'use client';

import { useRef, useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { InlineAlert } from '@/components/shared/inline-alert';
import { DOC_TAGS, formatFileSize, getMaxUploadBytes } from '@/lib/doc-utils';
import type { DealDocumentRow } from '@/components/deals/deal-document-actions';

export type { DealDocumentRow };

type GenerateType = 'offer' | 'cma';

interface DealDocumentPanelProps {
  dealId: string;
  documents: DealDocumentRow[];
  onRefresh: () => Promise<void>;
  defaultTag?: string;
  tagFilter?: string[];
  allowUpload?: boolean;
  allowGenerate?: GenerateType | null;
  title?: string;
}

export function DealDocumentPanel({
  dealId,
  documents,
  onRefresh,
  defaultTag = 'Other',
  tagFilter,
  allowUpload = true,
  allowGenerate = null,
  title = 'Documents',
}: DealDocumentPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tag, setTag] = useState(defaultTag);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = tagFilter?.length
    ? documents.filter((d) => d.tag && tagFilter.includes(d.tag))
    : documents;

  async function downloadDocument(documentId: number) {
    const res = await fetch(`/api/deals/${dealId}/documents/${documentId}/download-url`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Could not get download link');
      return;
    }
    const { downloadUrl } = await res.json();
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  }

  async function handleUpload(file: File) {
    if (file.size > getMaxUploadBytes()) {
      setError('File exceeds 50MB limit');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const urlRes = await fetch(`/api/deals/${dealId}/documents/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          tag,
          fileSize: file.size,
        }),
      });
      if (!urlRes.ok) {
        const data = await urlRes.json().catch(() => ({}));
        throw new Error(data.error ?? 'Could not start upload');
      }
      const { documentId, uploadUrl } = await urlRes.json();

      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!putRes.ok) throw new Error('Upload to storage failed');

      const confirmRes = await fetch(`/api/deals/${dealId}/documents/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });
      if (!confirmRes.ok) {
        const data = await confirmRes.json().catch(() => ({}));
        throw new Error(data.error ?? 'Could not confirm upload');
      }

      await onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleGenerate() {
    if (!allowGenerate) return;
    setError(null);
    setGenerating(true);
    try {
      const path = allowGenerate === 'offer' ? 'generate-offer' : 'generate-cma';
      const res = await fetch(`/api/deals/${dealId}/documents/${path}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Could not generate PDF');
      }
      const { downloadUrl } = await res.json();
      await onRefresh();
      if (downloadUrl) window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function toggleVisibility(documentId: number, clientVisible: boolean) {
    await fetch(`/api/deals/${dealId}/documents`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId, clientVisible }),
    });
    await onRefresh();
  }

  async function deleteDocument(documentId: number) {
    if (!confirm('Delete this document?')) return;
    await fetch(`/api/deals/${dealId}/documents/${documentId}`, { method: 'DELETE' });
    await onRefresh();
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--pg-text-faint)' }}>
          {title}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {allowUpload && (
            <>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="pg-input"
                style={{ fontSize: 12, padding: '6px 10px' }}
              >
                {(tagFilter?.length ? DOC_TAGS.filter((t) => tagFilter.includes(t)) : DOC_TAGS).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                ref={inputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                }}
              />
              <button
                type="button"
                className="pg-btn pg-btn-sm"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                <Icon name="file" size={12} />
                {uploading ? 'Uploading…' : 'Upload file'}
              </button>
            </>
          )}
          {allowGenerate === 'offer' && (
            <button type="button" className="pg-btn pg-btn-sm pg-btn-primary" disabled={generating} onClick={() => void handleGenerate()}>
              <Icon name="file-text" size={12} />
              {generating ? 'Generating…' : 'Generate offer PDF'}
            </button>
          )}
          {allowGenerate === 'cma' && (
            <button type="button" className="pg-btn pg-btn-sm pg-btn-primary" disabled={generating} onClick={() => void handleGenerate()}>
              <Icon name="file-text" size={12} />
              {generating ? 'Generating…' : 'Generate CMA PDF'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 12 }}>
          <InlineAlert variant="error">{error}</InlineAlert>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--pg-text-faint)', fontSize: 12 }}>
          No documents yet. Upload a file{allowGenerate ? ' or generate a PDF' : ''}.
        </div>
      ) : (
        <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
          {filtered.map((doc, i, a) => {
            const canDownload = doc.status === 'ready';
            return (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 14px',
                  borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none',
                  fontSize: 13,
                }}
              >
                <Icon name="file-text" size={15} color="var(--pg-text-faint)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }} className="pg-truncate">{doc.filename}</div>
                  <div style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>
                    {doc.tag ?? 'Other'}
                    {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ''}
                    {doc.status === 'pending' ? ' · Uploading…' : ''}
                    {doc.status === 'legacy' ? ' · Metadata only (re-upload)' : ''}
                    {doc.source?.startsWith('generated') ? ' · Generated' : ''}
                  </div>
                </div>
                {canDownload && (
                  <button type="button" className="pg-btn pg-btn-sm" onClick={() => void downloadDocument(doc.id)}>
                    Download
                  </button>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--pg-text-dim)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={doc.clientVisible}
                    onChange={(e) => void toggleVisibility(doc.id, e.target.checked)}
                    style={{ accentColor: 'var(--pg-accent)' }}
                  />
                  Client
                </label>
                {canDownload && (
                  <button
                    type="button"
                    className="pg-btn pg-btn-sm pg-btn-ghost"
                    onClick={() => void deleteDocument(doc.id)}
                    aria-label="Delete"
                  >
                    <Icon name="x" size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
