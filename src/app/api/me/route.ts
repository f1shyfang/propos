import { NextResponse } from "next/server";

export async function GET() {
  // Auth removed — return a default agent identity for the demo
  return NextResponse.json({
    id: 'demo-agent',
    name: 'Demo Agent',
    email: 'agent@demo.com',
    role: 'agent',
  });
}
