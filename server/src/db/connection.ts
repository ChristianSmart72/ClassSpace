import { createClient, type InValue } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, '../../uploads');

type InArgs = InValue[];

interface DbWrapper {
  prepare<T extends object = Record<string, unknown>>(sql: string): {
    get(...args: InArgs): Promise<T | null>;
    all(...args: InArgs): Promise<T[]>;
    run(...args: InArgs): Promise<{ lastInsertRowid: number; changes: number }>;
  };
  execute(sql: string | { sql: string; args?: InArgs }): Promise<any>;
  batch(stmts: ({ sql: string; args?: InArgs } | string)[]): Promise<any>;
}

let wrapper: DbWrapper | null = null;
let rawClient: ReturnType<typeof createClient> | null = null;

function createDbWrapper(): DbWrapper {
  const url = process.env.TURSO_DB_URL!;
  const authToken = process.env.TURSO_DB_TOKEN!;

  const client = createClient({ url, authToken });
  rawClient = client;

  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  return {
    prepare<T extends object = Record<string, unknown>>(sql: string) {
      return {
        get: async (...args: InArgs): Promise<T | null> => {
          const r = await client.execute({ sql, args });
          return (r.rows[0] ?? null) as unknown as T | null;
        },
        all: async (...args: InArgs): Promise<T[]> => {
          const r = await client.execute({ sql, args });
          return r.rows as unknown as T[];
        },
        run: async (...args: InArgs) => {
          const r = await client.execute({ sql, args });
          return {
            lastInsertRowid: r.lastInsertRowid ? Number(r.lastInsertRowid) : 0,
            changes: r.rowsAffected,
          };
        },
      };
    },
    execute(sql: string | { sql: string; args?: InArgs }) {
      return client.execute(sql);
    },
    batch(stmts: ({ sql: string; args?: InArgs } | string)[]) {
      const normalized = stmts.map(s => (typeof s === 'string' ? { sql: s, args: [] as InArgs } : s));
      return client.batch(normalized);
    },
  };
}

export function getDb(): DbWrapper {
  if (!wrapper) wrapper = createDbWrapper();
  return wrapper;
}

export async function closeDb(): Promise<void> {
  if (rawClient) {
    try {
      rawClient.close();
    } catch {
      // client may already be closed
    }
    rawClient = null;
  }
  wrapper = null;
}

export async function transaction<T>(fn: () => Promise<T>): Promise<T> {
  const db = getDb();
  await db.execute('BEGIN');
  try {
    const result = await fn();
    await db.execute('COMMIT');
    return result;
  } catch (e) {
    await db.execute('ROLLBACK').catch(() => {});
    throw e;
  }
}

export async function isSpaceMember(spaceId: string, userId: number): Promise<boolean> {
  const row = await getDb().prepare(
    'SELECT 1 FROM space_members WHERE space_id = ? AND user_id = ?'
  ).get(spaceId, userId);
  return !!row;
}
