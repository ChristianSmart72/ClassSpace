import { getDb } from '../db/connection.js';
import { seedDatabase } from '../db/seed.js';

export async function resetDatabase(): Promise<{ success: boolean }> {
  const db = getDb();
  db.exec(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS reactions;
    DROP TABLE IF EXISTS timetable;
    DROP TABLE IF EXISTS materials;
    DROP TABLE IF EXISTS announcements;
    DROP TABLE IF EXISTS courses;
    DROP TABLE IF EXISTS space_members;
    DROP TABLE IF EXISTS spaces;
    DROP TABLE IF EXISTS users;
    PRAGMA foreign_keys = ON;
  `);
  await seedDatabase();
  return { success: true };
}
