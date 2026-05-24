export const DOC_TAGS = [
  'Contract of Sale',
  'Section 32 / Vendor Statement',
  'Strata Report',
  'Building Inspection',
  'Pest Inspection',
  'Finance Approval',
  'Stamp Duty Receipt',
  'Certificate of Title',
  'CMA Report',
  'Offer Letter',
  'Correspondence',
  'Other',
] as const;

export const DOCUMENT_SOURCES = ['upload', 'generated_offer', 'generated_cma'] as const;
export type DocumentSource = (typeof DOCUMENT_SOURCES)[number];

export const DOCUMENT_STATUSES = ['pending', 'ready', 'failed', 'legacy'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

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
  'CMA Report': '#1d6fa4',
  'Offer Letter': '#6b21a8',
  Correspondence: '#374151',
  Other: '#6b7280',
};

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export function sanitizeFilename(name: string): string {
  const base = name.replace(/[/\\]/g, '_').replace(/[^\w.\- ()]/g, '_').trim();
  return base.slice(0, 200) || 'document';
}

export function getMaxUploadBytes(): number {
  return MAX_UPLOAD_BYTES;
}

export function getDocTagColor(tag: string): string {
  return TAG_COLORS[tag] ?? '#6b7280';
}

export function formatFileSize(bytes: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
