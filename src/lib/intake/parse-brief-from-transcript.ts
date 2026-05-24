import { z } from 'zod';
import {
  BUYER_TYPES,
  CONTACT_METHODS,
  DEAL_BREAKER_IDS,
  ENGAGEMENT_TYPES,
  MUST_HAVE_IDS,
  PARKING_OPTIONS,
  PRE_APPROVAL_STATUSES,
  PROPERTY_TYPES,
  PURCHASE_PURPOSES,
  SYDNEY_SUBURBS,
  URGENCY_OPTIONS,
  type BriefFormPayload,
} from '@/lib/brief-field-options';
import { normalizePropertyType } from '@/lib/property-type-utils';

const llmBriefSchema = z.object({
  clientName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  contactMethod: z.string().nullable().optional(),
  engagementType: z.string().nullable().optional(),
  preApprovalStatus: z.string().nullable().optional(),
  budgetMin: z.union([z.number(), z.string()]).nullable().optional(),
  budgetMax: z.union([z.number(), z.string()]).nullable().optional(),
  buyerType: z.string().nullable().optional(),
  propertyTypes: z.array(z.string()).nullable().optional(),
  minBeds: z.number().nullable().optional(),
  minBaths: z.number().nullable().optional(),
  parking: z.string().nullable().optional(),
  suburbs: z.array(z.string()).nullable().optional(),
  mustHaves: z.array(z.string()).nullable().optional(),
  dealBreakers: z.array(z.string()).nullable().optional(),
  urgency: z.string().nullable().optional(),
  purchasePurpose: z.string().nullable().optional(),
  auctionWillingness: z.boolean().nullable().optional(),
});

export type ParsedBriefResult = {
  parsed: BriefFormPayload;
  missingFields: string[];
  confidence: Record<string, 'high' | 'low'>;
};

export function parseBudgetValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.round(value));
  }
  const raw = String(value).toLowerCase().replace(/[$,\s]/g, '');
  if (!raw) return '';

  const millionMatch = raw.match(/^([\d.]+)m(?:illion)?$/);
  if (millionMatch) return String(Math.round(parseFloat(millionMatch[1]) * 1_000_000));

  const thousandMatch = raw.match(/^([\d.]+)k$/);
  if (thousandMatch) return String(Math.round(parseFloat(thousandMatch[1]) * 1_000));

  const numeric = parseFloat(raw);
  if (Number.isFinite(numeric)) {
    if (numeric < 1000) return String(Math.round(numeric * 1_000_000));
    return String(Math.round(numeric));
  }
  return '';
}

function pickEnum<T extends readonly string[]>(value: string | null | undefined, allowed: T, fallback: T[number]): T[number] {
  if (!value) return fallback;
  const lower = value.toLowerCase().trim();
  const match = allowed.find((item) => item.toLowerCase() === lower);
  if (match) return match;
  const partial = allowed.find((item) => lower.includes(item.toLowerCase()) || item.toLowerCase().includes(lower));
  return partial ?? fallback;
}

function normalizeSuburb(name: string): string {
  const trimmed = name.trim();
  const match = SYDNEY_SUBURBS.find((s) => s.toLowerCase() === trimmed.toLowerCase());
  if (match) return match;
  return trimmed.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function normalizeIdList(values: string[] | null | undefined, allowed: readonly string[]): string[] {
  if (!values?.length) return [];
  const result = new Set<string>();
  for (const val of values) {
    const lower = val.toLowerCase().replace(/\s+/g, '_');
    const exact = allowed.find((id) => id === lower || id === val);
    if (exact) result.add(exact);
    else {
      const partial = allowed.find((id) => lower.includes(id) || id.includes(lower));
      if (partial) result.add(partial);
    }
  }
  return [...result];
}

export function normalizeParsedBrief(raw: z.infer<typeof llmBriefSchema>): ParsedBriefResult {
  const missingFields: string[] = [];
  const confidence: Record<string, 'high' | 'low'> = {};

  function track(field: string, value: unknown, required = false) {
    const empty = value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
    if (empty) {
      confidence[field] = 'low';
      if (required) missingFields.push(field);
    } else {
      confidence[field] = 'high';
    }
  }

  const clientName = raw.clientName?.trim() ?? '';
  track('clientName', clientName, true);

  const email = raw.email?.trim() ?? '';
  track('email', email, true);

  const phone = raw.phone?.trim() ?? '';
  track('phone', phone, true);

  const budgetMin = parseBudgetValue(raw.budgetMin);
  const budgetMax = parseBudgetValue(raw.budgetMax);
  track('budgetMin', budgetMin, true);
  track('budgetMax', budgetMax, true);

  const propertyTypes = (raw.propertyTypes ?? [])
    .map(normalizePropertyType)
    .filter((t): t is string => t !== null);
  track('propertyTypes', propertyTypes, true);

  const suburbs = (raw.suburbs ?? []).map(normalizeSuburb).filter(Boolean);
  track('suburbs', suburbs, true);

  const parsed: BriefFormPayload = {
    clientName,
    email,
    phone,
    contactMethod: pickEnum(raw.contactMethod ?? undefined, CONTACT_METHODS, 'email'),
    engagementType: pickEnum(raw.engagementType ?? undefined, ENGAGEMENT_TYPES, 'full-service'),
    preApprovalStatus: pickEnum(raw.preApprovalStatus ?? undefined, PRE_APPROVAL_STATUSES, 'Not Started'),
    budgetMin,
    budgetMax,
    buyerType: pickEnum(raw.buyerType ?? undefined, BUYER_TYPES, 'owner-occupier'),
    propertyTypes,
    minBeds: raw.minBeds && raw.minBeds > 0 ? raw.minBeds : 2,
    minBaths: raw.minBaths && raw.minBaths > 0 ? raw.minBaths : 1,
    parking: pickEnum(raw.parking ?? undefined, PARKING_OPTIONS, 'nice_to_have'),
    suburbs,
    mustHaves: normalizeIdList(raw.mustHaves, MUST_HAVE_IDS),
    dealBreakers: normalizeIdList(raw.dealBreakers, DEAL_BREAKER_IDS),
    urgency: pickEnum(raw.urgency ?? undefined, URGENCY_OPTIONS, '3 months'),
    purchasePurpose: pickEnum(raw.purchasePurpose ?? undefined, PURCHASE_PURPOSES, 'PPOR'),
    auctionWillingness: raw.auctionWillingness ?? true,
  };

  return { parsed, missingFields, confidence };
}

export function buildParsePrompt(transcript: string): string {
  return `You are an expert Australian buyer's agent intake assistant. Extract structured buyer brief fields from the meeting transcript below.

Return ONLY valid JSON matching this schema (use null for unknown fields):
{
  "clientName": string | null,
  "email": string | null,
  "phone": string | null,
  "contactMethod": "email" | "phone" | "sms" | null,
  "engagementType": "full-service" | "sourcing-only" | "negotiation-only" | null,
  "preApprovalStatus": "Not Started" | "In Progress" | "Pre-Approved" | "Formal Approval" | "Expired" | null,
  "budgetMin": number | null,
  "budgetMax": number | null,
  "buyerType": "owner-occupier" | "investor" | "first-home buyer" | "upsizer" | "downsizer" | null,
  "propertyTypes": string[] (choose from: ${PROPERTY_TYPES.join(', ')}) | null,
  "minBeds": number | null,
  "minBaths": number | null,
  "parking": "required" | "nice_to_have" | "not_needed" | null,
  "suburbs": string[] | null,
  "mustHaves": string[] (ids: ${MUST_HAVE_IDS.join(', ')}) | null,
  "dealBreakers": string[] (ids: ${DEAL_BREAKER_IDS.join(', ')}) | null,
  "urgency": "Immediate" | "3 months" | "6 months" | "12 months" | "No fixed timeline" | null,
  "purchasePurpose": "PPOR" | "Investment" | "SMSF" | "Rentvesting" | null,
  "auctionWillingness": boolean | null
}

Budget values should be in AUD as whole numbers (e.g. 800000 for $800K, 1100000 for $1.1M).
Australian phone numbers may appear without country code.

TRANSCRIPT:
${transcript}`;
}

export function parseLlmJson(content: string): z.infer<typeof llmBriefSchema> {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON object in LLM response');
  const parsed = JSON.parse(jsonMatch[0]);
  return llmBriefSchema.parse(parsed);
}

export async function parseBriefFromTranscript(transcript: string): Promise<ParsedBriefResult> {
  const OpenAI = (await import('openai')).default;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You extract structured buyer brief data from transcripts. Respond with JSON only.' },
      { role: 'user', content: buildParsePrompt(transcript) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from LLM');

  const raw = parseLlmJson(content);
  return normalizeParsedBrief(raw);
}
