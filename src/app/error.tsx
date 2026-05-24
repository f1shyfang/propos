'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--pg-bg)', color: 'var(--pg-text)' }}>
      <h2 className="pg-display" style={{ marginBottom: 16 }}>Something went wrong!</h2>
      <p style={{ color: 'var(--pg-text-dim)', marginBottom: 24, maxWidth: 400, textAlign: 'center' }}>
        We encountered an unexpected error. Our team has been notified.
      </p>
      <button className="pg-btn pg-btn-primary" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
