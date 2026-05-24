import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('agent');
    
    // Return dummy data for demo since DATABASE_URL is not configured
    const invoices = [
      {
        id: 1,
        dealId: Number((await params).id),
        amount: 15000,
        description: 'Initial Deposit',
        status: 'paid',
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        generatedPdfUrl: '/demo-invoice.pdf',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
    return NextResponse.json({ invoices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('agent');
    const body = await req.json();

    if (!body.amount || !body.description) {
      return NextResponse.json({ error: 'Amount and description are required' }, { status: 400 });
    }

    // Return dummy success for demo
    const newInvoice = {
      id: Math.floor(Math.random() * 1000) + 2,
      dealId: Number((await params).id),
      amount: body.amount,
      description: body.description,
      status: 'draft',
      dueDate: body.dueDate ? new Date(body.dueDate).toISOString() : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      generatedPdfUrl: '/demo-invoice.pdf',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ invoice: newInvoice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
