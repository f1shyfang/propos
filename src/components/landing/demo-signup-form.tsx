import Link from "next/link";

import { demoSignup, login } from "@/app/login/actions";
import { Logo } from "@/components/shared/logo";

type DemoSignupFormProps = {
  error?: string;
};

export function DemoSignupForm({ error }: DemoSignupFormProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <Link href="/" className="no-underline" aria-label="Propos home">
        <Logo />
      </Link>

      <div>
        <p className="pg-label mb-3">Buyer&apos;s agent terminal</p>
        <h1 className="pg-display text-3xl leading-tight tracking-tight">
          One workspace for briefs, matches, and client feedback.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--pg-text-dim)]">
          Create a demo account to explore the agent dashboard — pre-seeded properties,
          briefs, and a live client portal loop.
        </p>
      </div>

      <form action={demoSignup} className="pg-card flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-sm font-semibold">Start the demo</h2>
          <p className="mt-1 text-xs text-[var(--pg-text-faint)]">
            Email and password — you&apos;ll go straight into the app.
          </p>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[var(--pg-text-dim)]">Name (optional)</span>
          <input
            name="name"
            type="text"
            autoComplete="name"
            className="pg-input"
            placeholder="Jess Morgan"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[var(--pg-text-dim)]">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="pg-input"
            placeholder="you@agency.com.au"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[var(--pg-text-dim)]">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="pg-input"
            placeholder="At least 6 characters"
          />
        </label>

        {error ? <p className="text-sm text-[var(--pg-red)]">{error}</p> : null}

        <button type="submit" className="pg-btn pg-btn-primary w-full justify-center py-2.5">
          Create account &amp; open demo
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <p className="text-center text-xs uppercase tracking-wider text-[var(--pg-text-faint)]">
          Or jump in with seeded accounts
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <form action={login}>
            <input type="hidden" name="email" value="agent@demo.com" />
            <input type="hidden" name="password" value="password123" />
            <input type="hidden" name="next" value="/dashboard" />
            <input type="hidden" name="returnTo" value="/" />
            <button type="submit" className="pg-btn w-full justify-center">
              Log in as demo agent
            </button>
          </form>
          <form action={login}>
            <input type="hidden" name="email" value="sarah@demo.com" />
            <input type="hidden" name="password" value="password123" />
            <input type="hidden" name="next" value="/portal" />
            <input type="hidden" name="returnTo" value="/" />
            <button type="submit" className="pg-btn w-full justify-center">
              Log in as demo client
            </button>
          </form>
        </div>
      </div>

      <p className="text-center text-sm text-[var(--pg-text-dim)]">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
