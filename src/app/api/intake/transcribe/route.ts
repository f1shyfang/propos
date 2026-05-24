import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { validateM4aUpload } from '@/lib/intake/validate-m4a';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 503 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const validation = validateM4aUpload(file.name, file.size, file.type);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
    });

    const transcript = transcription.text?.trim();
    if (!transcript) {
      return NextResponse.json({ error: 'No speech detected in audio file' }, { status: 422 });
    }

    return NextResponse.json({ transcript, filename: file.name });
  } catch (error) {
    console.error('Transcribe error:', error);
    return NextResponse.json(
      { error: 'Could not transcribe audio. Try a shorter clip or paste the transcript manually.' },
      { status: 500 },
    );
  }
}
