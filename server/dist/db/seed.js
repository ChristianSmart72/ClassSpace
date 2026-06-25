import { getDb, closeDb } from './connection.js';
import { createTables } from './schema.js';
import { hashPassword } from '../lib/hash.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
export async function seedDatabase() {
    const db = getDb();
    createTables();
    const existing = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (existing.count > 0) {
        console.log('Database already seeded, skipping.');
        return;
    }
    const seedPath = join(__dirname, '../../seed/seed-data.json');
    const raw = readFileSync(seedPath, 'utf-8');
    const data = JSON.parse(raw);
    const passwordHash = await hashPassword(data.user.password);
    const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
    const insertSpace = db.prepare('INSERT INTO spaces (id, name, dept, level, uni, rep_id, invite_code) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const insertMember = db.prepare('INSERT INTO space_members (space_id, user_id, role) VALUES (?, ?, ?)');
    const insertCourse = db.prepare('INSERT INTO courses (space_id, name, code, icon, color_index) VALUES (?, ?, ?, ?, ?)');
    const insertAnnouncement = db.prepare(`INSERT INTO announcements (space_id, course_id, title, body, type, author_id, urgent, pinned, deadline, venue, instructions, submission_method, format)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insertMaterial = db.prepare('INSERT INTO materials (space_id, course_id, name, file_type, category, file_size, uploader_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const tx = db.transaction(() => {
        const userResult = insertUser.run(data.user.name, data.user.email, passwordHash, data.user.role);
        const userId = userResult.lastInsertRowid;
        insertSpace.run(data.space.id, data.space.name, data.space.dept, data.space.level, data.space.uni, userId, data.space.invite_code);
        insertMember.run(data.space.id, userId, 'rep');
        const courseIds = [];
        for (const course of data.courses) {
            const result = insertCourse.run(data.space.id, course.name, course.code, course.icon, course.color_index);
            courseIds.push(result.lastInsertRowid);
        }
        for (const ann of data.announcements) {
            const courseId = ann.course_index >= 0 ? courseIds[ann.course_index] : null;
            insertAnnouncement.run(data.space.id, courseId, ann.title, ann.body, ann.type, userId, ann.urgent ? 1 : 0, ann.pinned ? 1 : 0, ann.deadline || null, ann.venue || null, ann.instructions || null, ann.submission_method || null, ann.format || null);
        }
        for (const mat of data.materials) {
            const courseId = courseIds[mat.course_index];
            insertMaterial.run(data.space.id, courseId, mat.name, mat.file_type, mat.category, mat.file_size, userId);
        }
    });
    tx();
    console.log('Database seeded successfully!');
}
if (process.argv[1] && (process.argv[1].includes('seed') || process.argv[1].endsWith('seed.ts'))) {
    seedDatabase()
        .then(() => closeDb())
        .catch(err => { console.error('Seed failed:', err); process.exit(1); });
}
//# sourceMappingURL=seed.js.map