import type { NextRequest } from "next/server";

export type UserRole = "agent" | "client";

function getRole(user: { role?: string | null }): UserRole {
  return user.role === "client" ? "client" : "agent";
}

type SessionPayload = {
  user: { id: string; email: string; name: string; role?: string | null };
};

export async function fetchSession(request: NextRequest): Promise<SessionPayload | null> {
  const cookie = request.headers.get("cookie") ?? "";
  if (!cookie) return null;

  const res = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
    headers: { cookie },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = (await res.json()) as SessionPayload | null;
  if (!data?.user?.id) return null;
  return data;
}

export function sessionRole(session: SessionPayload | null): UserRole | null {
  if (!session) return null;
  return getRole(session.user);
}
