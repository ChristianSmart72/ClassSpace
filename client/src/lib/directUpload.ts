import { genUploader } from 'uploadthing/client';

function getToken(): string | null {
  try { return localStorage.getItem('token') } catch { return null }
}

export const directUpload = genUploader({
  url: '/api/uploadthing',
  package: 'classspace-web',
  fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    const token = getToken();
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  },
});

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
