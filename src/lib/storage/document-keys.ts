import { randomUUID } from 'crypto';

export function buildDealDocumentS3Key(dealId: number, filename: string): string {
  const ext = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : '';
  const safeExt = ext.replace(/[^.\w]/g, '').slice(0, 10) || '';
  return `deals/${dealId}/${randomUUID()}${safeExt}`;
}
