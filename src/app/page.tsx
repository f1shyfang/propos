import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { BetaSignupForm } from "@/components/landing/beta-signup-form";

const workflow = [
  {
    step: "01",
    title: "Capture the brief",
    description:
      "Budget, suburbs, must-haves, and deal-breakers in one structured brief — not scattered notes and email threads.",
  },
  {
    step: "02",
    title: "Match & compare",
    description:
      "Pre-scored listings with CMA ranges and risk overlays so you evaluate options without jumping between portals and spreadsheets.",
  },
  {
    step: "03",
    title: "Shortlist & share",
    description:
      "Curate properties and send a branded client portal — your buyer sees a clear shortlist instead of random links.",
  },
  {
    step: "04",
    title: "Structured feedback",
    description:
      "Interested, need more info, or not for me — clients respond in-app and you see decisions on your Today dashboard.",
  },
];

const features = [
  {
    title: "Today dashboard",
    description: "Morning-first view: what needs you now, this week's milestones, and live client feedback.",
  },
  {
    title: "Pipeline & deals",
    description: "Kanban from suggestion through settlement — cooling-off, PEXA status, and stage-aware deal cards.",
  },
  {
    title: "Property intelligence",
    description: "Detail pages with comparables, flood and heritage overlays, and side-by-side comparison.",
  },
  {
    title: "Client portal",
    description: "Branded experience for buyers and co-buyers — shared feedback without a second login.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--pg-bg)] text-[var(--pg-text)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5 sm:px-8">
        <Link href="/" className="no-underline" aria-label="Propos home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-[var(--pg-text-dim)] md:flex" aria-label="Primary">
          <a href="#workflow" className="transition-colors hover:text-[var(--pg-text)]">
            Workflow
          </a>
          <a href="#features" className="transition-colors hover:text-[var(--pg-text)]">
            Features
          </a>
          <a href="#beta" className="transition-colors hover:text-[var(--pg-text)]">
            Beta
          </a>
          <Link href="/portal" className="transition-colors hover:text-[var(--pg-text)]">
            Client portal
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="pg-btn hidden sm:inline-flex">
            Sign in
          </Link>
          <a href="#beta" className="pg-btn pg-btn-accent">
            Join beta
          </a>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-16">
          <p className="pg-label mb-5">Buyer&apos;s agent terminal · Australia · Beta</p>
          <h1 className="pg-display max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
            One calm workspace for{" "}
            <span className="pg-chalk-underline">every property deal</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--pg-text-dim)] sm:text-lg">
            Propos unifies briefs, matching, shortlists, and client feedback — so Australian buyer&apos;s agents
            spend less time portal-hopping and more time closing for clients.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#beta"
              className="inline-flex items-center justify-center rounded-md bg-[var(--pg-accent)] px-5 py-3 text-sm font-medium text-[#1A1814] transition-[filter] hover:brightness-[0.97]"
            >
              Join beta trial
            </a>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md border border-[var(--pg-border)] px-5 py-3 text-sm text-[var(--pg-text)] transition-colors hover:bg-[var(--pg-bg-2)]"
            >
              Sign in to dashboard
            </Link>
          </div>
          <dl className="mt-14 grid gap-8 border-t border-[var(--pg-border)] pt-10 sm:grid-cols-3">
            <div>
              <dt className="pg-label mb-2">Workflow</dt>
              <dd className="pg-display text-2xl font-semibold tracking-tight">Brief → Match → Share</dd>
            </div>
            <div>
              <dt className="pg-label mb-2">Built for</dt>
              <dd className="pg-display text-2xl font-semibold tracking-tight">AU conventions</dd>
              <dd className="mt-1 text-sm text-[var(--pg-text-dim)]">Bed/Bath/Car · DD/MM · AUD</dd>
            </div>
            <div>
              <dt className="pg-label mb-2">Replace</dt>
              <dd className="pg-display text-2xl font-semibold tracking-tight">6–8 tools</dd>
              <dd className="mt-1 text-sm text-[var(--pg-text-dim)]">CRM, portals, spreadsheets, chat</dd>
            </div>
          </dl>
        </section>

        <section
          id="workflow"
          className="border-y border-[var(--pg-border)] bg-[var(--pg-surface)] py-16 sm:py-20"
          aria-labelledby="workflow-heading"
        >
          <div className="mx-auto max-w-6xl px-6 sm:px-8">
            <h2 id="workflow-heading" className="pg-display text-2xl font-semibold tracking-tight sm:text-3xl">
              The loop your clients feel
            </h2>
            <p className="mt-3 max-w-xl text-[var(--pg-text-dim)]">
              From first brief to structured feedback — one platform, no context switching.
            </p>
            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {workflow.map((item) => (
                <li
                  key={item.step}
                  className="rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-bg)] p-6"
                >
                  <span className="pg-mono text-xs font-medium text-[var(--pg-text-faint)]">{item.step}</span>
                  <h3 className="pg-display mt-3 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--pg-text-dim)]">{item.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="py-16 sm:py-20" aria-labelledby="features-heading">
          <div className="mx-auto max-w-6xl px-6 sm:px-8">
            <h2 id="features-heading" className="pg-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Built for how buyer&apos;s agents actually work
            </h2>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <li
                  key={feature.title}
                  className="rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-6"
                >
                  <h3 className="text-base font-medium">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--pg-text-dim)]">{feature.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="beta"
          className="border-t border-[var(--pg-border)] bg-[var(--pg-bg-2)] py-16 sm:py-20"
          aria-labelledby="beta-heading"
        >
          <div className="mx-auto max-w-6xl px-6 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="pg-label mb-3">Limited beta · Australia</p>
              <h2 id="beta-heading" className="pg-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Join the beta trial
              </h2>
              <p className="mt-4 text-[var(--pg-text-dim)]">
                We&apos;re onboarding a small cohort of buyer&apos;s agents. Get early access to the full terminal —
                briefs, pipeline, and client portal — and help shape what ships next.
              </p>
            </div>
            <div className="mx-auto mt-10 max-w-3xl">
              <BetaSignupForm />
            </div>
            <p className="mx-auto mt-8 max-w-lg text-center text-sm text-[var(--pg-text-faint)]">
              Already have access?{" "}
              <Link href="/login" className="text-[var(--pg-text-dim)] underline-offset-2 hover:text-[var(--pg-text)] hover:underline">
                Sign in to your dashboard
              </Link>
              {" · "}
              <Link href="/signup" className="text-[var(--pg-text-dim)] underline-offset-2 hover:text-[var(--pg-text)] hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </section>

        <section className="border-t border-[var(--pg-border)] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-6 text-center sm:px-8">
            <h2 className="pg-display text-2xl font-semibold tracking-tight sm:text-3xl">
              See what your clients see
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[var(--pg-text-dim)]">
              Explore the branded client portal — shortlists, co-buyer feedback, and structured responses.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/portal" className="pg-btn pg-btn-primary min-w-[200px] justify-center px-6 py-2.5">
                View client portal demo
              </Link>
              <a href="#beta" className="pg-btn min-w-[200px] justify-center px-6 py-2.5">
                Join beta trial
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--pg-border)] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-[var(--pg-text-faint)] sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} Propos</p>
          <div className="flex gap-6">
            <a href="#beta" className="hover:text-[var(--pg-text-dim)]">
              Beta
            </a>
            <Link href="/login" className="hover:text-[var(--pg-text-dim)]">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-[var(--pg-text-dim)]">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
