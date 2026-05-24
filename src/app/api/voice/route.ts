import { NextRequest, NextResponse } from 'next/server';

const MOCK_RESPONSES: Record<string, string> = {
  'hello': "Hi there! I'm your PropertyGo voice assistant. How can I help you today?",
  'hi': "Hello! Ready to help with your property needs.",
  'hey': "Hey! What can I do for you?",
  'what can you do': "I can help you search properties, check pipeline status, review briefs, and answer questions about your active deals. Just ask!",
  'help': "I'm your voice assistant for PropertyGo. Try saying things like 'show me properties in Richmond', 'what's in my pipeline', or 'tell me about the Smith Street deal'.",
  'properties': "You currently have 1,247 properties tracked. 6 are settling this month with a combined value of $11.8 million. Would you like me to filter by location or price range?",
  'pipeline': "Your pipeline has 14 deals across 6 stages, totalling $48.2 million. The largest deal is 12 Smith Street, Richmond at $2.4 million, cooling off today.",
  'briefs': "You have 8 active clients. 3 have new matches since yesterday. Priya Anand has 5 new properties for Brunswick.",
  'clients': "You have 23 active clients. 3 are onboarding this week: David Webb, Priya Anand, and Daniel Cho.",
  'smith street': "12 Smith Street, Richmond is a $2.4 million property. The cooling-off period expires today at 5pm for Sarah and Tom Chen. You should confirm unconditional soon.",
  'cooling off': "The cooling-off for 12 Smith Street expires today at 5pm. It's the Chen's purchase at $2.4 million. I recommend confirming unconditional before end of business.",
  'auction': "14 Park Street goes to auction this Saturday at 11am. Webb is the client, guide is $1.6 million. That's in 3 days.",
  'settlement': "22 Oak Avenue settles on the 31st for Daniel Cho at $1.62 million. PEXA is ready and the pre-settlement inspection is booked for Friday.",
    'default': "I heard you. I'm a demo voice assistant for PropertyGo. In a full setup, I'd connect to your backend and give real answers about properties, clients, and deals. Try asking about 'properties', 'pipeline', 'clients', or 'deals' for demo responses.",
};

function findResponse(input: string): string {
  const lower = input.toLowerCase().trim();
  
  // Check for exact matches or keyword containment
  for (const [key, value] of Object.entries(MOCK_RESPONSES)) {
    if (key === 'default') continue;
    if (lower.includes(key)) {
      return value;
    }
  }
  
  return MOCK_RESPONSES.default;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // In production, you would call OpenAI or your preferred LLM here:
    // const completion = await openai.chat.completions.create({...})
    
    // For demo/development, return a mock response
    const reply = findResponse(message);
    
    // Simulate a small delay for realism
    await new Promise(r => setTimeout(r, 400));

    return NextResponse.json({ 
      reply,
      mode: 'mock',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Voice API error:', error);
    return NextResponse.json(
      { error: 'Failed to process voice request' },
      { status: 500 }
    );
  }
}
