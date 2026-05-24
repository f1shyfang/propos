'use client';

import { useRef, useState } from 'react';
import { Icon } from '@/components/shared/icon';

interface TranscriptInputProps {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function TranscriptInput({ value, disabled, onChange }: TranscriptInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  function handleTxtFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.txt')) {
      setFileError('Only .txt files are supported.');
      return;
    }
    if (file.size > 512 * 1024) {
      setFileError('Text file exceeds 512 KB limit.');
      return;
    }
    setFileError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      onChange(text.trim());
    };
    reader.onerror = () => setFileError('Could not read file.');
    reader.readAsText(file);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <textarea
        className="pg-input"
        value={value}
        disabled={disabled}
        placeholder="Paste a meeting transcript here, or upload a .txt file…"
        onChange={(e) => onChange(e.target.value)}
        rows={12}
        style={{ width: '100%', resize: 'vertical', minHeight: 200, fontFamily: 'var(--pg-font-body)', fontSize: 14, lineHeight: 1.5 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          className="pg-btn"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
        >
          <Icon name="file-text" size={13} />Upload .txt
        </button>
        <span style={{ fontSize: 12, color: 'var(--pg-text-faint)' }}>Plain text only</span>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,text/plain"
          style={{ display: 'none' }}
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleTxtFile(file);
            e.target.value = '';
          }}
        />
      </div>
      {fileError && <div style={{ fontSize: 13, color: 'var(--pg-red)' }}>{fileError}</div>}
    </div>
  );
}
