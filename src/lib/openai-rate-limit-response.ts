import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  checkOpenAiRateLimit,
  getClientRateLimitKey,
  type OpenAiRateLimitOperation,
  type RateLimitCheckResult,
} from '@/lib/openai-rate-limit';

export function openAiRateLimitResponse(
  result: Extract<RateLimitCheckResult, { allowed: false }>,
): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many OpenAI requests. Please wait before trying again.',
      code: 'RATE_LIMITED',
    },
    {
      status: 429,
      headers: { 'Retry-After': String(result.retryAfterSec) },
    },
  );
}

export function enforceOpenAiRateLimit(
  req: NextRequest,
  operation: OpenAiRateLimitOperation,
): NextResponse | null {
  const result = checkOpenAiRateLimit(getClientRateLimitKey(req), operation);
  if (result.allowed) return null;
  return openAiRateLimitResponse(result);
}
