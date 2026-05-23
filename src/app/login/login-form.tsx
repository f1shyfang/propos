"use client";

import Link from "next/link";
import { useActionState } from "react";

import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ message }: { message?: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <>
      <form action={formAction} className="flex flex-col gap-3">
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
            autoComplete="current-password"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>

        {message ? <p className="text-sm text-green-600">{message}</p> : null}
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
