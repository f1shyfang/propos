import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
const DOWNLOAD_EXPIRY_SEC = 15 * 60;

function getBucket(): string {
  const bucket = process.env.AWS_S3_BUCKET ?? process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('AWS_S3_BUCKET (or R2_BUCKET_NAME) is not configured');
  return bucket;
}

function getClient(): S3Client {
  const endpoint = process.env.AWS_S3_ENDPOINT ?? process.env.R2_S3_ENDPOINT;
  const region = process.env.AWS_REGION ?? process.env.R2_REGION ?? (endpoint ? 'auto' : 'ap-southeast-2');

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: Boolean(endpoint),
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
}

export function isS3Configured(): boolean {
  return Boolean(
    (process.env.AWS_S3_BUCKET ?? process.env.R2_BUCKET_NAME) &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY,
  );
}

export async function getPresignedUploadUrl(key: string, mimeType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: mimeType,
  });
  return getSignedUrl(getClient(), command, { expiresIn: 900 });
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  return getSignedUrl(getClient(), command, { expiresIn: DOWNLOAD_EXPIRY_SEC });
}

export async function putObject(buffer: Buffer, key: string, mimeType: string): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }),
  );
}

export async function headObject(key: string): Promise<{ contentLength: number | undefined } | null> {
  try {
    const result = await getClient().send(
      new HeadObjectCommand({ Bucket: getBucket(), Key: key }),
    );
    return { contentLength: result.ContentLength };
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}
