export const M4A_MAX_BYTES = 25 * 1024 * 1024; // OpenAI Whisper limit

const M4A_MIME_TYPES = new Set([
  'audio/m4a',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'video/mp4', // some .m4a files report as video/mp4
]);

export type M4aValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function validateM4aFile(file: File): M4aValidationResult {
  const name = file.name.toLowerCase();
  if (!name.endsWith('.m4a')) {
    return { valid: false, error: 'Only .m4a audio files are supported.' };
  }
  if (file.size > M4A_MAX_BYTES) {
    return { valid: false, error: 'File exceeds 25 MB limit.' };
  }
  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' };
  }
  if (file.type && !M4A_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type}` };
  }
  return { valid: true };
}

export function validateM4aUpload(
  filename: string,
  size: number,
  mimeType?: string | null,
): M4aValidationResult {
  const fakeFile = { name: filename, size, type: mimeType ?? '' } as File;
  return validateM4aFile(fakeFile);
}
