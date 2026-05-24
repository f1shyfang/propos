import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { SignupForm } from "./signup-form";

type SearchParams = Promise<{ error?: string }>;

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <Link href="/" className="no-underline" aria-label="PropOS home">
        <Logo />
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Create an account</h1>
        <p className="text-sm text-gray-500">Get started with PropOS.</p>
      </div>

      <SignupForm error={error} />
    </main>
  );
}
