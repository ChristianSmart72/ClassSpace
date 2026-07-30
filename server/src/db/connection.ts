import { createClient, type InValue } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, '../../uploads');

type InArgs = InValue[];

interface DbWrapper {
  prepare(sql: string): {
    get(...args: InArgs): Promise<Record<string, unknown> | null>;
    all(...args: InArgs): Promise<Record<string, unknown>[]>;
    run(...args: InArgs): Promise<{ lastInsertRowid: number; changes: number }>;
  };
  execute(sql: string | { sql: string; args?: InArgs }): Promise<any>;
  batch(stmts: ({ sql: string; args?: InArgs } | string)[]): Promise<any>;
}

let wrapper: DbWrapper | null = null;

function createDbWrapper(): DbWrapper {
  const url = process.env.TURSO_DB_URL;
  const authToken = process.env.TURSO_DB_TOKEN;

  if (!url) {
    throw new Error('TURSO_DB_URL environment variable is required — set it in Render dashboard');
  }

  const client = createClient({ url, authToken });

  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  return {
    prepare(sql: string) {
      return {
        get: async (...args: InArgs) => {
          const r = await client.execute({ sql, args });
          return (r.rows[0] ?? null) as Record<string, unknown> | null;
        },
        all: async (...args: InArgs) => {
          const r = await client.execute({ sql, args });
          return r.rows as Record<string, unknown>[];
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

export async function transaction<T>(fn: () => Promise<T>): Promise<T> {
  const db = getDb();
  await db.execute('BEGIN');
  try {
    const result = await fn();
    await db.execute('COMMIT');
    return result;
  } catch (e) {
    await db.execute('ROLLBACK');
    throw e;
  }
}
