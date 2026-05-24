'use client';

import { useCallback, useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { DocumentDropzone } from '@/components/deals/document-dropzone';
import { DOC_TAGS, formatFileSize, type DocTag } from '@/lib/doc-utils';
import { uploadDealDocuments } from '@/lib/upload-deal-document';

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
  const [tag, setTag] = useState<DocTag>(defaultTag);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scoped = checklistItemId != null
    ? documents.filter((d) => d.checklistItemId === checklistItemId)
    : documents;

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      setBusy(true);
      setError(null);
      try {
        const { uploaded, errors } = await uploadDealDocuments(dealId, files, { tag, checklistItemId });
        if (uploaded > 0) await onRefresh();
        if (errors.length > 0) setError(errors.join('; '));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setBusy(false);
      }
    },
    [checklistItemId, dealId, onRefresh, tag],
  );

  async function generatePdf(kind: 'offer' | 'cma') {
    setBusy(true);
    setError(null);
    try {
      const path = kind === 'offer' ? 'generate-offer' : 'generate-cma';
      const res = await fetch(`/api/deals/${dealId}/documents/${path}`, {
        method: 'POST',
        credentials: 'include',
      });
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

  if (compact) {
    return (
      <div style={{ marginTop: 8 }}>
        <DocumentDropzone
          compact
          uploading={busy}
          onFilesSelected={(files) => void handleFilesSelected(files)}
        />
        {error && (
          <div style={{ fontSize: 11, color: 'var(--pg-red)', marginTop: 6 }}>{error}</div>
        )}
        {scoped.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
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

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
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
      <DocumentDropzone uploading={busy} onFilesSelected={(files) => void handleFilesSelected(files)} />
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
                {doc.source?.startsWith('generated') ? ' · Generated' : ''}
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
