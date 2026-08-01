import { UTApi, UTFile } from 'uploadthing/server';

export const MAX_FILE_SIZE = 16 * 1024 * 1024;

let utapi: UTApi | null = null;

function getUtapi() {
  if (!utapi) {
    if (!process.env.UPLOADTHING_SECRET) {
      throw new Error('UPLOADTHING_SECRET environment variable is required');
    }
    utapi = new UTApi({ token: process.env.UPLOADTHING_SECRET });
  }
  return utapi;
}

export function keyFromUrl(url: string): string | null {
  const match = /utfs\.io\/f\/([\w-]+)/.exec(url);
  return match ? match[1] : null;
}

export function uploadTooLargeError(): Error & { statusCode: number } {
  const err = new Error('File too large — max 16MB per file') as Error & { statusCode: number };
  err.statusCode = 413;
  return err;
}

export async function uploadFile(base64: string, name: string, mimeType?: string): Promise<{ url: string; key: string }> {
  const buffer = Buffer.from(base64.includes(',') ? base64.split(',')[1] : base64, 'base64');
  return uploadFileBuffer(buffer, name, mimeType);
}

export async function uploadFileBuffer(buffer: Buffer, name: string, mimeType?: string): Promise<{ url: string; key: string }> {
  if (buffer.length > MAX_FILE_SIZE) throw uploadTooLargeError();
  const file = new UTFile([new Uint8Array(buffer)], name, { type: mimeType || 'application/octet-stream' });
  const result = await getUtapi().uploadFiles([file]);
  const uploaded = result[0];
  if (uploaded.error) throw new Error(`Upload failed: ${uploaded.error.message}`);
  return { url: uploaded.data!.url, key: uploaded.data!.key };
}

export async function deleteFile(key: string): Promise<void> {
  await getUtapi().deleteFiles([key]);
}

export async function deleteFileByUrl(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const key = keyFromUrl(url);
  if (!key) return;
  try {
    await deleteFile(key);
  } catch {
    // file may already be gone — deleting rows is what matters
  }
}
