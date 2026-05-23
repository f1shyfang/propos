import { DemoSignupForm } from "@/components/landing/demo-signup-form";

type SearchParams = Promise<{ error?: string }>;

export default async function LandingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-12 px-6 py-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 lg:px-10 lg:py-16">
        <section className="hidden lg:block">
          <p className="pg-label mb-4">Live demo scenario</p>
          <h2 className="pg-display mb-6 text-4xl leading-[1.1] tracking-tight">
            Sarah &amp; Tom are buying in Richmond. You brief, match, shortlist — they
            react in the portal.
          </h2>
          <ul className="space-y-4 text-sm leading-relaxed text-[var(--pg-text-dim)]">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pg-accent)]" />
              Capture a buyer brief and see ranked property matches in seconds.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pg-accent)]" />
              Shortlist listings and share to the client portal — feedback appears on your
              dashboard.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pg-accent)]" />
              Run the demo side-by-side: agent dashboard + client portal in two windows.
            </li>
          </ul>
        </section>

        <section className="flex justify-center lg:justify-end">
          <DemoSignupForm error={error} />
        </section>
      </div>
    </main>
  );
}
