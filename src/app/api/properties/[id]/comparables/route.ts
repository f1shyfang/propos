import { NextResponse } from "next/server";

import { demoCMARecords, demoProperties } from "@/lib/demo-data";
import { requireRole } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("agent");

  const { id } = await params;
  if (!demoProperties.some((property) => property.id === id)) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Property not found" } }, { status: 404 });
  }

  return NextResponse.json({
    data: demoCMARecords.filter((record) => record.property_id === id),
  });
}
