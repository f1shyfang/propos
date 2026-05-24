'use client';

import { useCallback, useRef, useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { validateM4aFile } from '@/lib/intake/validate-m4a';

interface IntakeDropzoneProps {
  disabled?: boolean;
  onFileSelected: (file: File) => void;
}

export function IntakeDropzone({ disabled, onFileSelected }: IntakeDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    const validation = validateM4aFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    setError(null);
    onFileSelected(file);
  }, [onFileSelected]);

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled) return;
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--pg-accent)' : 'var(--pg-border)'}`,
          borderRadius: 12,
          padding: '48px 24px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: dragOver ? 'var(--pg-bg-2)' : 'transparent',
          opacity: disabled ? 0.6 : 1,
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <Icon name="mic" size={32} color="var(--pg-text-faint)" />
        <div style={{ fontSize: 15, fontWeight: 500, marginTop: 16 }}>Drop your .m4a recording here</div>
        <div style={{ fontSize: 13, color: 'var(--pg-text-dim)', marginTop: 8 }}>
          or click to browse — max 25 MB
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".m4a,audio/m4a,audio/mp4"
          style={{ display: 'none' }}
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
      </div>
      {error && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--pg-red)' }}>{error}</div>
      )}
    </div>
  );
}
