import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { clientSuggestionsTable, buyerBriefsTable } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(req: Request) {
  const profile = await requireRole("client");
  const body = await req.json();
  const { url, briefId } = body;
  
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const [suggestion] = await db.insert(clientSuggestionsTable).values({
    clientId: profile.id,
    briefId: briefId ?? null,
    url: url,
    status: 'pending',
  }).returning();

  return NextResponse.json({ success: true, suggestion });
}

export async function GET() {
  await requireRole("agent");
  
  const suggestions = await db
    .select({
      id: clientSuggestionsTable.id,
      url: clientSuggestionsTable.url,
      client_id: clientSuggestionsTable.clientId,
      client_name: buyerBriefsTable.clientName, // In reality we'd join user table, but clientName from brief works as MVP
      created_at: clientSuggestionsTable.createdAt,
      status: clientSuggestionsTable.status,
    })
    .from(clientSuggestionsTable)
    .leftJoin(buyerBriefsTable, eq(clientSuggestionsTable.clientId, buyerBriefsTable.clientId))
    .orderBy(desc(clientSuggestionsTable.createdAt));

  // Deduplicate by suggestion id since a client might have multiple briefs
  const uniqueSuggestions = [];
  const seen = new Set();
  for (const s of suggestions) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      uniqueSuggestions.push(s);
    }
  }

  return NextResponse.json({ suggestions: uniqueSuggestions });
}

export async function PATCH(req: Request) {
  await requireRole("agent");
  const body = await req.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }

  const [updated] = await db
    .update(clientSuggestionsTable)
    .set({ status })
    .where(eq(clientSuggestionsTable.id, id))
    .returning();

  return NextResponse.json({ success: true, suggestion: updated });
}
