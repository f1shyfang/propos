import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold">Next.js + Supabase</h1>
      <p className="text-gray-600">
        Starter app with email/password auth via @supabase/ssr.
      </p>

      <div className="flex gap-3">
        {user ? (
          <Link
            href="/protected"
            className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
            >
              Sign up
            </Link>
          </>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
        <code>.env.local</code> to connect your project.
      </p>
    </main>
  );
}
