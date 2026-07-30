const REQUIRED = [
  'JWT_SECRET',
  'VAPID_SUBJECT',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'TURSO_DB_URL',
  'TURSO_DB_TOKEN',
  'UPLOADTHING_SECRET',
] as const;

export function validateEnv(): void {
  const missing: string[] = [];
  for (const key of REQUIRED) {
    if (!process.env[key]) missing.push(key);
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
