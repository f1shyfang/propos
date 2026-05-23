export const DOC_TAGS = [
  'Contract of Sale',
  'Section 32 / Vendor Statement',
  'Strata Report',
  'Building Inspection',
  'Pest Inspection',
  'Finance Approval',
  'Stamp Duty Receipt',
  'Certificate of Title',
  'Correspondence',
  'Other',
] as const;

export type DocTag = (typeof DOC_TAGS)[number];

const TAG_COLORS: Record<string, string> = {
  'Contract of Sale': '#1d6fa4',
  'Section 32 / Vendor Statement': '#1d6fa4',
  'Strata Report': '#6b21a8',
  'Building Inspection': '#92400e',
  'Pest Inspection': '#92400e',
  'Finance Approval': '#166534',
  'Stamp Duty Receipt': '#166534',
  'Certificate of Title': '#374151',
  Correspondence: '#374151',
  Other: '#6b7280',
};

export function getDocTagColor(tag: string): string {
  return TAG_COLORS[tag] ?? '#6b7280';
}

export function formatFileSize(bytes: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
