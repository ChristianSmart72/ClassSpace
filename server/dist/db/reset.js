import { getDb } from '../db/connection.js';
import { seedDatabase } from '../db/seed.js';
export async function resetDatabase() {
    const db = getDb();
    db.exec(`
    DROP TABLE IF EXISTS materials;
    DROP TABLE IF EXISTS announcements;
    DROP TABLE IF EXISTS courses;
    DROP TABLE IF EXISTS space_members;
    DROP TABLE IF EXISTS spaces;
    DROP TABLE IF EXISTS users;
  `);
    await seedDatabase();
    return { success: true };
}
//# sourceMappingURL=reset.js.map