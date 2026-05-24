'use client';

import { useCallback, useRef, useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { formatFileSize, getMaxUploadBytes } from '@/lib/doc-utils';

const DEFAULT_ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.doc,.docx';

interface DocumentDropzoneProps {
  disabled?: boolean;
  uploading?: boolean;
  onFilesSelected: (files: File[]) => void;
  compact?: boolean;
  accept?: string;
}

export function DocumentDropzone({
  disabled,
  uploading,
  onFilesSelected,
  compact = false,
  accept = DEFAULT_ACCEPT,
}: DocumentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      const maxBytes = getMaxUploadBytes();
      const tooLarge = files.filter((f) => f.size > maxBytes);
      if (tooLarge.length > 0) {
        setError(
          tooLarge.length === 1
            ? `${tooLarge[0].name} exceeds ${formatFileSize(maxBytes)} limit`
            : `${tooLarge.length} files exceed the ${formatFileSize(maxBytes)} limit`,
        );
        return;
      }

      setError(null);
      onFilesSelected(files);
    },
    [onFilesSelected],
  );

  const isDisabled = disabled || uploading;

  return (
    <div
      role="button"
      tabIndex={0}
      onDragOver={(e) => {
        e.preventDefault();
        if (!isDisabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (isDisabled) return;
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !isDisabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) inputRef.current?.click();
      }}
      style={{
        border: `2px dashed ${dragOver ? 'var(--pg-accent)' : 'var(--pg-border)'}`,
        borderRadius: compact ? 8 : 12,
        padding: compact ? '14px 16px' : '32px 24px',
        textAlign: 'center',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        background: dragOver ? 'var(--pg-bg-2)' : 'transparent',
        opacity: isDisabled ? 0.65 : 1,
        transition: 'border-color 0.15s, background 0.15s',
        marginBottom: compact ? 0 : 16,
      }}
    >
      <Icon name="file" size={compact ? 20 : 28} color="var(--pg-text-faint)" />
      <div
        style={{
          fontSize: compact ? 12 : 14,
          fontWeight: 500,
          marginTop: compact ? 6 : 12,
          color: uploading ? 'var(--pg-text-dim)' : 'var(--pg-text)',
        }}
      >
        {uploading ? 'Uploading…' : compact ? 'Drop files or click to upload' : 'Drop files here'}
      </div>
      {!compact && (
        <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginTop: 6 }}>
          {uploading ? 'Saving to storage…' : 'or click to browse — PDF, images, Word · max 50 MB each'}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        style={{ display: 'none' }}
        disabled={isDisabled}
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {error && (
        <div style={{ marginTop: compact ? 8 : 12, fontSize: 12, color: 'var(--pg-red)' }}>{error}</div>
      )}
    </div>
  );
}
