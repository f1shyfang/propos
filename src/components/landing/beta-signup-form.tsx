'use client';

import { FormEvent, useState } from 'react';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export function BetaSignupForm({ id }: { id?: string }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');

    try {
      const res = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
      setMessage("You're on the list — we'll email you when your beta spot opens.");
      setEmail('');
      setName('');
    } catch {
      setStatus('error');
      setMessage('Network error. Check your connection and try again.');
    }
  }

  if (status === 'success') {
    return (
      <div
        id={id}
        className="rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-8 text-center"
        role="status"
      >
        <p className="pg-display text-xl font-semibold tracking-tight">You&apos;re on the waitlist</p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--pg-text-dim)]">{message}</p>
        <button
          type="button"
          className="pg-btn mt-6"
          onClick={() => {
            setStatus('idle');
            setMessage('');
          }}
        >
          Register another email
        </button>
      </div>
    );
  }

  return (
    <form
      id={id}
      onSubmit={onSubmit}
      className="rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-6 sm:p-8"
      noValidate
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5 text-sm">
          <span className="pg-label">Work email</span>
          <input
            className="pg-input"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@agency.com.au"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'submitting'}
            aria-invalid={status === 'error' && !email}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5 text-sm sm:max-w-[220px]">
          <span className="pg-label">
            Your name <span className="normal-case tracking-normal text-[var(--pg-text-faint)]">(optional)</span>
          </span>
          <input
            className="pg-input"
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Jess Morgan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={status === 'submitting'}
          />
        </label>
        <button
          type="submit"
          className="pg-btn pg-btn-accent shrink-0 justify-center px-6 py-2.5 sm:min-w-[160px]"
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? 'Joining…' : 'Join beta trial'}
        </button>
      </div>
      {status === 'error' && message ? (
        <p className="mt-3 text-sm text-[var(--pg-red)]" role="alert">
          {message}
        </p>
      ) : (
        <p className="mt-3 text-xs text-[var(--pg-text-faint)]">
          Limited spots for Australian buyer&apos;s agents. No spam — we&apos;ll only email about beta access.
        </p>
      )}
    </form>
  );
}
