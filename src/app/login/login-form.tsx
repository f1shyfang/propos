"use client";

import { useRouter } from "next/navigation";

export function LoginForm({ message }: { message?: string }) {
  const router = useRouter();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        router.push("/dashboard");
        router.refresh();
      }}
      className="flex flex-col gap-3"
    >
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue="agent@demo.com"
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          defaultValue="password123"
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>

      {message ? <p className="text-sm text-green-600">{message}</p> : null}

      <button
        type="submit"
        className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
      >
        Sign in as agent
      </button>

      <button
        type="button"
        onClick={() => router.push("/portal/login")}
        className="rounded border border-gray-300 px-4 py-2 text-gray-900 hover:bg-gray-50"
      >
        Open Sarah&apos;s portal
      </button>
    </form>
  );
}
