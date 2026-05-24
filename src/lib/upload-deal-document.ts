import { getMaxUploadBytes } from '@/lib/doc-utils';

export type UploadDealDocumentOptions = {
  tag?: string;
  checklistItemId?: number;
};

export async function uploadDealDocument(
  dealId: string,
  file: File,
  options: UploadDealDocumentOptions = {},
): Promise<void> {
  if (file.size > getMaxUploadBytes()) {
    throw new Error('File exceeds 50MB limit');
  }

  const urlRes = await fetch(`/api/deals/${dealId}/documents/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      tag: options.tag,
      checklistItemId: options.checklistItemId,
    }),
  });

  if (!urlRes.ok) {
    const data = await urlRes.json().catch(() => ({}));
    throw new Error(data.error ?? 'Could not start upload');
  }

  const { documentId, uploadUrl } = await urlRes.json();

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!putRes.ok) throw new Error('Upload to storage failed');

  const completeRes = await fetch(`/api/deals/${dealId}/documents/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId }),
  });
  if (!completeRes.ok) {
    const data = await completeRes.json().catch(() => ({}));
    throw new Error(data.error ?? 'Could not confirm upload');
  }
}

export async function uploadDealDocuments(
  dealId: string,
  files: File[],
  options: UploadDealDocumentOptions = {},
): Promise<{ uploaded: number; errors: string[] }> {
  const errors: string[] = [];
  let uploaded = 0;

  for (const file of files) {
    try {
      await uploadDealDocument(dealId, file, options);
      uploaded += 1;
    } catch (e) {
      errors.push(`${file.name}: ${e instanceof Error ? e.message : 'Upload failed'}`);
    }
  }

  return { uploaded, errors };
}
