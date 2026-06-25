import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../data/classspace.db');
let db;
export function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
    }
    return db;
}
export function closeDb() {
    if (db) {
        db.close();
    }
}
//# sourceMappingURL=connection.js.map