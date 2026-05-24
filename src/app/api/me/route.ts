import { NextResponse } from "next/server";

import { getUserRole } from "@/lib/auth";
import { getSession, unauthorizedResponse } from "@/lib/auth-server";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorizedResponse();

  const { user } = session;
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: getUserRole(user),
  });
}
