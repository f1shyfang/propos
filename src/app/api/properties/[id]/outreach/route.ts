import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('agent');
    const body = await req.json();

    if (!body.message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Dummy success for demo since DATABASE_URL is not configured
    console.log(`Mock Outreach to property ${(await params).id}:`, body.message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Outreach error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
