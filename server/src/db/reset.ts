import { getDb } from '../db/connection.js';
import { seedDatabase } from '../db/seed.js';

export async function resetDatabase(): Promise<{ success: boolean }> {
  const db = getDb();

  const tables = [
    'poll_votes', 'poll_options', 'polls', 'reactions',
    'timetable', 'materials', 'announcements', 'courses',
    'space_members', 'spaces', 'users', 'push_subscriptions', 'opportunities',
  ];

  for (const t of tables) {
    await db.prepare(`DROP TABLE IF EXISTS ${t}`).run();
  }

  await seedDatabase();
  return { success: true };
}
