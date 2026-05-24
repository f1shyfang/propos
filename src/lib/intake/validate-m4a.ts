export const AUDIO_MAX_BYTES = 25 * 1024 * 1024; // OpenAI Whisper limit

// Whisper-supported extensions and MIME types
const AUDIO_EXTENSIONS = new Set(['.m4a', '.mp3', '.mp4', '.mpeg', '.mpga', '.wav', '.webm', '.ogg', '.flac']);

const AUDIO_MIME_TYPES = new Set([
  'audio/m4a', 'audio/mp4', 'audio/x-m4a', 'audio/aac',
  'audio/mpeg', 'audio/mp3',
  'audio/wav', 'audio/x-wav', 'audio/wave',
  'audio/webm',
  'audio/ogg', 'audio/flac',
  'video/mp4', // some .m4a files report as video/mp4
  'video/webm',
]);

export type M4aValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function validateM4aFile(file: File): M4aValidationResult {
  const name = file.name.toLowerCase();
  const hasValidExt = [...AUDIO_EXTENSIONS].some(ext => name.endsWith(ext));
  if (!hasValidExt) {
    return { valid: false, error: 'Unsupported file type. Please upload an audio file (mp3, m4a, wav, webm, etc.).' };
  }
  if (file.size > AUDIO_MAX_BYTES) {
    return { valid: false, error: 'File exceeds 25 MB limit.' };
  }
  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' };
  }
  if (file.type && !AUDIO_MIME_TYPES.has(file.type)) {
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
