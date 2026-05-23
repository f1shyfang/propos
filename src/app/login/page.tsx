import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { LoginForm } from "./login-form";

type SearchParams = Promise<{ message?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { message } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <Link href="/" className="no-underline" aria-label="Propos home">
        <Logo />
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-gray-500">Welcome back to Propos.</p>
      </div>

      <LoginForm message={message} />
    </main>
  );
}
