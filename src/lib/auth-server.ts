import { NextResponse } from "next/server";

import { type UserRole } from "@/lib/auth";

/** Auth disabled — server routes always run as this demo agent. */
const DEMO_SESSION = {
  session: {
    id: "demo-session",
    userId: "demo-agent",
    expiresAt: new Date("2099-01-01"),
    token: "demo",
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null as string | null,
    userAgent: null as string | null,
  },
  user: {
    id: "demo-agent",
    name: "Demo Agent",
    email: "agent@demo.com",
    emailVerified: true,
    image: null as string | null,
    organization: "Buyer's agency",
    role: "agent",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export type AppSession = typeof DEMO_SESSION;

function demoSession(): AppSession {
  return {
    session: { ...DEMO_SESSION.session },
    user: { ...DEMO_SESSION.user },
  };
}

export async function getSession() {
  return demoSession();
}

export async function requireSession() {
  return demoSession();
}

export async function requireRole(_role: UserRole) {
  return demoSession();
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
