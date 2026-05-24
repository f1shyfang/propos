import type { NextRequest } from "next/server";

export type UserRole = "agent" | "client";

type SessionPayload = {
  user: { id: string; email: string; name: string; role?: string | null };
};

const DEMO_SESSION: SessionPayload = {
  user: {
    id: "demo-agent",
    email: "agent@demo.com",
    name: "Demo Agent",
    role: "agent",
  },
};

export async function fetchSession(_request: NextRequest): Promise<SessionPayload> {
  return DEMO_SESSION;
}

export function sessionRole(_session: SessionPayload | null): UserRole {
  return "agent";
}
