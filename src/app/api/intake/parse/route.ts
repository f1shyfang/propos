import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { intakeTranscriptionsTable } from '@/lib/db/schema';
import { parseBriefFromTranscript } from '@/lib/intake/parse-brief-from-transcript';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, source, originalFilename } = body as {
      transcript?: string;
      source?: 'audio' | 'text';
      originalFilename?: string;
    };

    if (!transcript?.trim()) {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
    }
    if (source !== 'audio' && source !== 'text') {
      return NextResponse.json({ error: 'source must be "audio" or "text"' }, { status: 400 });
    }

    const result = await parseBriefFromTranscript(transcript.trim());

    const [record] = await db.insert(intakeTranscriptionsTable).values({
      source,
      originalFilename: originalFilename ?? null,
      rawTranscript: transcript.trim(),
      parsedJson: result.parsed,
      status: 'parsed',
    }).returning();

    return NextResponse.json({
      intakeId: record.id,
      parsed: result.parsed,
      missingFields: result.missingFields,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error('Parse error:', error);
    const message = error instanceof Error ? error.message : 'Failed to parse transcript';
    if (message.includes('OPENAI_API_KEY')) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json(
      { error: 'Could not parse transcript. You can fill in the form manually.' },
      { status: 500 },
    );
  }
}
