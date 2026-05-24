import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { eq, ilike, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "../src/lib/db/schema";

import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

const DEMO_PASSWORD = "demo12345";
const AGENT_EMAIL = "agent@demo.com";
const CLIENT_EMAIL = "sarah@demo.com";
const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

async function signUp(email: string, name: string) {
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": BASE_URL },
    body: JSON.stringify({ email, password: DEMO_PASSWORD, name }),
  });
  if (res.ok) return true;
  const text = await res.text();
  if (text.includes("already") || res.status === 422) return false;
  console.warn(`  sign-up ${email}: ${res.status} ${text.slice(0, 120)}`);
  return false;
}

async function ensureUser(email: string, name: string, role: "agent" | "client") {
  const existing = await db.select().from(schema.user).where(eq(schema.user.email, email)).limit(1);
  if (existing.length === 0) {
    const created = await signUp(email, name);
    if (created) console.log(`  created ${email}`);
    else console.log(`  could not create ${email} — sign up manually or start dev server`);
  }
  await db.update(schema.user).set({ role }).where(eq(schema.user.email, email));
  const [row] = await db.select().from(schema.user).where(eq(schema.user.email, email)).limit(1);
  return row ?? null;
}

async function main() {
  console.log("Seeding demo users…");

  const agent = await ensureUser(AGENT_EMAIL, "Demo Agent", "agent");
  const client = await ensureUser(CLIENT_EMAIL, "Sarah Chen", "client");

  if (agent) {
    await db.update(schema.buyerBriefsTable).set({ agentId: agent.id });
    console.log(`  linked briefs → agent ${agent.id}`);
  }

  if (client) {
    const updated = await db
      .update(schema.buyerBriefsTable)
      .set({ clientUserId: client.id })
      .where(ilike(schema.buyerBriefsTable.email, CLIENT_EMAIL))
      .returning({ id: schema.buyerBriefsTable.id });

    console.log(`  linked ${updated.length} brief(s) to client ${client.email}`);

    const briefIds = updated.map((b) => b.id);
    if (briefIds.length > 0) {
      const shared = await db
        .update(schema.shortlistsTable)
        .set({ sharedAt: new Date() })
        .where(
          inArray(schema.shortlistsTable.briefId, briefIds),
        )
        .returning({ id: schema.shortlistsTable.id });
      console.log(`  marked ${shared.length} shortlist row(s) as shared`);
    }
  }

  const unshared = await db
    .select({ id: schema.shortlistsTable.id })
    .from(schema.shortlistsTable)
    .where(isNull(schema.shortlistsTable.sharedAt))
    .limit(3);

  if (unshared.length > 0 && client) {
    const [brief] = await db
      .select()
      .from(schema.buyerBriefsTable)
      .where(eq(schema.buyerBriefsTable.clientUserId, client.id))
      .limit(1);
    if (brief) {
      for (const row of unshared) {
        await db
          .update(schema.shortlistsTable)
          .set({ briefId: brief.id, sharedAt: new Date() })
          .where(eq(schema.shortlistsTable.id, row.id));
      }
      console.log(`  reassigned ${unshared.length} orphan shortlist rows to brief ${brief.id}`);
    }
  }

  console.log("\nDemo credentials:");
  console.log(`  Agent:  ${AGENT_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  Client: ${CLIENT_EMAIL} / ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
