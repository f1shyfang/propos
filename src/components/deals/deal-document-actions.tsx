'use client';

import { useRef, useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { DOC_TAGS, formatFileSize, type DocTag } from '@/lib/doc-utils';

export type DealDocumentRow = {
  id: number;
  filename: string;
  tag: string | null;
  fileSize: number | null;
  status: string | null;
  s3Key: string | null;
  mimeType: string | null;
  source: string | null;
  checklistItemId: number | null;
  clientVisible: boolean;
  createdAt: string;
};

type Props = {
  dealId: string;
  documents: DealDocumentRow[];
  defaultTag?: DocTag;
  checklistItemId?: number;
  showGenerateOffer?: boolean;
  showGenerateCma?: boolean;
  onRefresh: () => Promise<void>;
  compact?: boolean;
};

export function DealDocumentActions({
  dealId,
  documents,
  defaultTag = 'Other',
  checklistItemId,
  showGenerateOffer = false,
  showGenerateCma = false,
  onRefresh,
  compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tag, setTag] = useState<DocTag>(defaultTag);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scoped = checklistItemId != null
    ? documents.filter((d) => d.checklistItemId === checklistItemId)
    : documents;

  async function uploadFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const urlRes = await fetch(`/api/deals/${dealId}/documents/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileSize: file.size,
          tag,
          checklistItemId,
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

      const completeRes = await fetch(`/api/deals/${dealId}/documents/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });
      if (!completeRes.ok) {
        const data = await completeRes.json().catch(() => ({}));
        throw new Error(data.error ?? 'Could not finalize upload');
      }
      await onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function generatePdf(kind: 'offer' | 'cma') {
    setBusy(true);
    setError(null);
    try {
      const path = kind === 'offer' ? 'generate-offer' : 'generate-cma';
      const res = await fetch(`/api/deals/${dealId}/documents/${path}`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Could not generate ${kind} PDF`);
      }
      const data = await res.json();
      await onRefresh();
      if (data.downloadUrl) window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setBusy(false);
    }
  }

  async function download(documentId: number) {
    const res = await fetch(`/api/deals/${dealId}/documents/${documentId}/download-url`);
    if (!res.ok) {
      setError('Download unavailable');
      return;
    }
    const { downloadUrl } = await res.json();
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div style={{ marginTop: compact ? 8 : 0 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: scoped.length ? 10 : 0 }}>
        {!compact && (
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value as DocTag)}
            style={{
              padding: '6px 10px',
              border: '1px solid var(--pg-border)',
              borderRadius: 6,
              background: 'var(--pg-bg)',
              color: 'var(--pg-text)',
              fontSize: 12,
            }}
          >
            {DOC_TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />
        <button type="button" className="pg-btn pg-btn-sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Icon name="file" size={12} />
          {busy ? 'Working…' : 'Upload file'}
        </button>
        {showGenerateOffer && (
          <button type="button" className="pg-btn pg-btn-sm pg-btn-primary" disabled={busy} onClick={() => void generatePdf('offer')}>
            <Icon name="file-text" size={12} />
            Generate offer PDF
          </button>
        )}
        {showGenerateCma && (
          <button type="button" className="pg-btn pg-btn-sm pg-btn-primary" disabled={busy} onClick={() => void generatePdf('cma')}>
            <Icon name="file-text" size={12} />
            Generate CMA PDF
          </button>
        )}
      </div>
      {error && (
        <div style={{ fontSize: 12, color: 'var(--pg-red)', marginBottom: 8 }}>{error}</div>
      )}
      {scoped.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {scoped.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: 'var(--pg-text-dim)',
              }}
            >
              <Icon name="file-text" size={14} color="var(--pg-text-faint)" />
              <span style={{ flex: 1 }} className="pg-truncate">
                {doc.filename}
                {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ''}
                {doc.status === 'pending' ? ' · uploading…' : ''}
              </span>
              {doc.status === 'ready' && doc.s3Key && (
                <button type="button" className="pg-btn pg-btn-sm" onClick={() => void download(doc.id)}>
                  Download
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
