import { NextResponse } from "next/server";

import { demoShortlists } from "@/lib/demo-data";
import { requireRole } from "@/lib/session";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("agent");

  const { id } = await params;
  const index = demoShortlists.findIndex((item) => item.id === id);
  if (index === -1) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Shortlist row not found" } }, { status: 404 });
  }

  demoShortlists.splice(index, 1);
  return new Response(null, { status: 204 });
}
