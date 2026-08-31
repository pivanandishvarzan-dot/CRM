import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bucket = process.env.STORAGE_BUCKET;
const configured = Boolean(bucket && process.env.STORAGE_ACCESS_KEY_ID && process.env.STORAGE_SECRET_ACCESS_KEY);
const client = new S3Client({
  region: process.env.STORAGE_REGION || 'auto',
  endpoint: process.env.STORAGE_ENDPOINT || undefined,
  forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
  credentials: configured ? {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
  } : undefined,
});

export const storageConfigured = configured;
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const documentTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

export function validateStorageFile(kind: 'image' | 'document', type: string, size: number) {
  const allowed = kind === 'image' ? imageTypes : documentTypes;
  const max = kind === 'image' ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
  if (!allowed.has(type)) throw new Error('UNSUPPORTED_FILE_TYPE');
  if (!Number.isFinite(size) || size <= 0 || size > max) throw new Error('FILE_TOO_LARGE');
}

function safeName(name: string) {
  return name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-100) || 'file';
}

export function makeStorageKey(propertyId: string, kind: 'image' | 'document', name: string) {
  return `properties/${propertyId}/${kind === 'image' ? 'images' : 'documents'}/${crypto.randomUUID()}-${safeName(name)}`;
}

export async function createUploadUrl(key: string, contentType: string) {
  if (!configured) throw new Error('STORAGE_NOT_CONFIGURED');
  return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket!, Key: key, ContentType: contentType }), { expiresIn: 600 });
}

export async function createDownloadUrl(key: string) {
  if (!configured) throw new Error('STORAGE_NOT_CONFIGURED');
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket!, Key: key }), { expiresIn: 300 });
}

export async function deleteStorageObject(key: string) {
  if (!configured) throw new Error('STORAGE_NOT_CONFIGURED');
  await client.send(new DeleteObjectCommand({ Bucket: bucket!, Key: key }));
}

export function internalFileUrl(key: string) {
  return `/api/storage/file?key=${encodeURIComponent(key)}`;
}

export function parseInternalFileUrl(url: string) {
  if (!url.startsWith('/api/storage/file?key=')) return null;
  return decodeURIComponent(url.slice('/api/storage/file?key='.length));
}
