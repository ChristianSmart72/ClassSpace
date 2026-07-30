import { UTApi, UTFile } from 'uploadthing/server';

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

export async function uploadFile(base64: string, name: string, mimeType?: string): Promise<{ url: string; key: string }> {
  const buffer = Buffer.from(base64.includes(',') ? base64.split(',')[1] : base64, 'base64');
  const file = new UTFile([buffer], name, { type: mimeType || 'application/octet-stream' });
  const result = await getUtapi().uploadFiles([file]);
  const uploaded = result[0];
  if (uploaded.error) throw new Error(`Upload failed: ${uploaded.error.message}`);
  return { url: uploaded.data!.url, key: uploaded.data!.key };
}

export async function deleteFile(key: string): Promise<void> {
  await getUtapi().deleteFiles([key]);
}
