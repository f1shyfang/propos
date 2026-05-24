import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth, getUserRole, type UserRole } from "@/lib/auth";

export type AppSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) return null;
  return session;
}

export async function requireRole(role: UserRole) {
  const session = await requireSession();
  if (!session) return null;
  if (getUserRole(session.user) !== role) return null;
  return session;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
