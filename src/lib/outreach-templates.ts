export const OUTREACH_TEMPLATES = [
  {
    id: 'intro_anonymised',
    label: 'Intro + Anonymised buyer brief',
    preview:
      'Hi, I represent a qualified buyer with finance approved. I can share an anonymised brief if this property may suit — are you open to a conversation?',
  },
] as const;

export type OutreachTemplateId = (typeof OUTREACH_TEMPLATES)[number]['id'];

export function getOutreachTemplate(id: string) {
  return OUTREACH_TEMPLATES.find((t) => t.id === id);
}
