import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { propertiesTable, dealsTable, buyerBriefsTable } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const lower = message.toLowerCase().trim();
    let reply = "I'm not sure how to answer that yet. I'm connected to your live database! Try asking about 'properties', 'pipeline', 'deals', or 'clients'.";

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      reply = "Hello! I am your AI assistant, now connected to your live database. How can I help you today?";
    } else if (lower.includes('properties')) {
      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(propertiesTable);
      reply = `You currently have ${count} properties tracked in your database. Would you like me to filter them for you?`;
    } else if (lower.includes('pipeline') || lower.includes('deals')) {
      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(dealsTable);
      reply = `Your pipeline has ${count} active deals right now. Check the Kanban board for the latest stages.`;
    } else if (lower.includes('brief') || lower.includes('client')) {
      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(buyerBriefsTable);
      reply = `You have ${count} active client briefs. Let me know if you want to create a new one.`;
    } else if (lower.includes('what can you do') || lower.includes('help')) {
      reply = "I can read your live database! Ask me about properties, your pipeline, or your clients.";
    }

    await new Promise(r => setTimeout(r, 400));

    return NextResponse.json({ 
      reply,
      mode: 'live-db-heuristic',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Voice API error:', error);
    return NextResponse.json({ error: 'Failed to process voice request' }, { status: 500 });
  }
}
