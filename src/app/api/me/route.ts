import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    id: 'demo-agent',
    name: 'Demo Agent',
    email: 'agent@demo.com',
    role: 'agent',
  });
}
