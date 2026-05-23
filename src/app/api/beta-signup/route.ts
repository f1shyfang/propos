import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { betaSignupsTable } from "@/lib/db/schema";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const name = body.name?.trim() || null;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const existing = await db
    .select({ id: betaSignupsTable.id })
    .from(betaSignupsTable)
    .where(eq(betaSignupsTable.email, email))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "This email is already on the beta waitlist" },
      { status: 409 },
    );
  }

  const [signup] = await db
    .insert(betaSignupsTable)
    .values({ email, name })
    .returning();

  return NextResponse.json({ signup }, { status: 201 });
}
