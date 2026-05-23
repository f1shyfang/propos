"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function SignupForm({ error: initialError }: { error?: string }) {
  const router = useRouter();
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const { error } = await authClient.signUp.email({ email, password, name: email.split("@")[0] });
    if (error) {
      setError(error.message ?? "Sign up failed.");
      setPending(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
