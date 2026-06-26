import { getDb, closeDb } from './connection.js';
import { createTables } from './schema.js';
import { hashPassword } from '../lib/hash.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SeedData {
  user: { name: string; email: string; password: string; role: string };
  extra_users?: { name: string; email: string; password: string; role: string }[];
  space: { id: string; name: string; dept: string; level: string; uni: string; invite_code: string };
  courses: { name: string; code: string; icon: string; color_index: number }[];
  timetable: {
    course_index: number;
    day: string;
    start_time: string;
    end_time: string;
    venue?: string;
    lecturer?: string;
  }[];
  announcements: {
    course_index: number;
    title: string;
    body: string;
    type: string;
    urgent: boolean;
    pinned: boolean;
    deadline?: string;
    venue?: string;
    instructions?: string;
    submission_method?: string;
    format?: string;
  }[];
  materials: { course_index: number; name: string; file_type: string; category: string; file_size: number }[];
  polls?: {
    question: string;
    options: string[];
    closes_at: string | null;
  }[];
}

export async function seedDatabase(): Promise<void> {
  const db = getDb();
  createTables();

  const existing = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (existing.count > 0) {
    console.log('Database already seeded, skipping.');
    return;
  }

  const seedPath = join(__dirname, '../../seed/seed-data.json');
  const raw = readFileSync(seedPath, 'utf-8');
  const data: SeedData = JSON.parse(raw);

  const passwordHash = await hashPassword(data.user.password);

  const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
  const insertSpace = db.prepare('INSERT INTO spaces (id, name, dept, level, uni, rep_id, invite_code) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertMember = db.prepare('INSERT INTO space_members (space_id, user_id, role) VALUES (?, ?, ?)');
  const insertCourse = db.prepare('INSERT INTO courses (space_id, name, code, icon, color_index) VALUES (?, ?, ?, ?, ?)');
  const insertAnnouncement = db.prepare(
    `INSERT INTO announcements (space_id, course_id, title, body, type, author_id, urgent, pinned, deadline, venue, instructions, submission_method, format)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertMaterial = db.prepare(
    'INSERT INTO materials (space_id, course_id, name, file_type, category, file_size, uploader_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertTimetable = db.prepare(
    'INSERT INTO timetable (space_id, course_id, day, start_time, end_time, venue, lecturer) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertPoll = db.prepare(
    'INSERT INTO polls (space_id, author_id, question, closes_at) VALUES (?, ?, ?, ?)'
  );
  const insertPollOption = db.prepare(
    'INSERT INTO poll_options (poll_id, text, display_order) VALUES (?, ?, ?)'
  );

  const extraHashes: string[] = [];
  for (const u of (data.extra_users || [])) {
    extraHashes.push(await hashPassword(u.password));
  }

  const tx = db.transaction(() => {
    const userResult = insertUser.run(data.user.name, data.user.email, passwordHash, data.user.role);
    const userId = userResult.lastInsertRowid as number;

    insertSpace.run(data.space.id, data.space.name, data.space.dept, data.space.level, data.space.uni, userId, data.space.invite_code);
    insertMember.run(data.space.id, userId, 'rep');

    for (let i = 0; i < (data.extra_users || []).length; i++) {
      const u = data.extra_users![i];
      const res = insertUser.run(u.name, u.email, extraHashes[i], u.role);
      insertMember.run(data.space.id, res.lastInsertRowid as number, 'member');
    }

    const courseIds: number[] = [];
    for (const course of data.courses) {
      const result = insertCourse.run(data.space.id, course.name, course.code, course.icon, course.color_index);
      courseIds.push(result.lastInsertRowid as number);
    }

    for (const entry of (data.timetable || [])) {
      const courseId = courseIds[entry.course_index];
      if (courseId) {
        insertTimetable.run(data.space.id, courseId, entry.day, entry.start_time, entry.end_time, entry.venue || null, entry.lecturer || null);
      }
    }

    for (const ann of data.announcements) {
      const courseId = ann.course_index >= 0 ? courseIds[ann.course_index] : null;
      insertAnnouncement.run(
        data.space.id, courseId, ann.title, ann.body, ann.type, userId,
        ann.urgent ? 1 : 0, ann.pinned ? 1 : 0,
        ann.deadline || null, ann.venue || null, ann.instructions || null,
        ann.submission_method || null, ann.format || null
      );
    }

    for (const mat of data.materials) {
      const courseId = courseIds[mat.course_index];
      insertMaterial.run(data.space.id, courseId, mat.name, mat.file_type, mat.category, mat.file_size, userId);
    }

    for (const poll of (data.polls || [])) {
      const res = insertPoll.run(data.space.id, userId, poll.question, poll.closes_at || null);
      const pollId = res.lastInsertRowid as number;
      poll.options.forEach((text, i) => insertPollOption.run(pollId, text, i));
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
