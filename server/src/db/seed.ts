import { getDb } from './connection.js';
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
  opportunities?: {
    title: string;
    description: string;
    category: string;
    link: string | null;
    deadline: string | null;
  }[];
}

export async function seedDatabase(): Promise<void> {
  const db = getDb();
  await createTables();

  const existing = await db.prepare<{ id: string }>("SELECT id FROM spaces WHERE id = 'pre220'").get();
  if (existing) {
    console.log('Default space (pre220) already exists, skipping seed.');
    return;
  }

  const seedPath = join(__dirname, '../../seed/seed-data.json');
  const raw = readFileSync(seedPath, 'utf-8');
  const data: SeedData = JSON.parse(raw);

  const passwordHash = await hashPassword(data.user.password);

  const extraHashes: string[] = [];
  for (const u of (data.extra_users || [])) {
    extraHashes.push(await hashPassword(u.password));
  }

  const oldSpace = await db.prepare<{ id: string }>("SELECT id FROM spaces WHERE invite_code = 'PRE-220' AND id != 'pre220'").get();
  if (oldSpace) {
    console.log('Removing old space data to avoid conflicts...');
    for (const table of ['announcements', 'materials', 'reactions', 'timetable', 'poll_votes', 'poll_options', 'polls', 'opportunities', 'courses', 'space_members']) {
      await db.prepare(`DELETE FROM ${table} WHERE space_id = ?`).run(oldSpace.id);
    }
    await db.prepare('DELETE FROM spaces WHERE id = ?').run(oldSpace.id);
  }

  let repId: number;

  const existingRep = await db.prepare<{ id: number }>('SELECT id FROM users WHERE email = ?').get(data.user.email);
  if (existingRep) {
    repId = existingRep.id;
  } else {
    const result = await db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(data.user.name, data.user.email, passwordHash, data.user.role);
    repId = result.lastInsertRowid;
  }

  await db.prepare('INSERT INTO spaces (id, name, dept, level, uni, rep_id, invite_code) VALUES (?, ?, ?, ?, ?, ?, ?)').run(data.space.id, data.space.name, data.space.dept, data.space.level, data.space.uni, repId, data.space.invite_code);
  await db.prepare('INSERT OR IGNORE INTO space_members (space_id, user_id, role) VALUES (?, ?, ?)').run(data.space.id, repId, 'rep');

  for (let i = 0; i < (data.extra_users || []).length; i++) {
    const u = data.extra_users![i];
    const existingUser = await db.prepare<{ id: number }>('SELECT id FROM users WHERE email = ?').get(u.email);
    let memberId: number;
    if (existingUser) {
      memberId = existingUser.id;
    } else {
      const res = await db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(u.name, u.email, extraHashes[i], u.role);
      memberId = res.lastInsertRowid;
    }
    await db.prepare('INSERT OR IGNORE INTO space_members (space_id, user_id, role) VALUES (?, ?, ?)').run(data.space.id, memberId, 'member');
  }

  const courseIds: number[] = [];
  for (const course of data.courses) {
    const result = await db.prepare('INSERT INTO courses (space_id, name, code, icon, color_index) VALUES (?, ?, ?, ?, ?)').run(data.space.id, course.name, course.code, course.icon, course.color_index);
    courseIds.push(result.lastInsertRowid);
  }

  for (const entry of (data.timetable || [])) {
    const courseId = courseIds[entry.course_index];
    if (courseId) {
      await db.prepare('INSERT INTO timetable (space_id, course_id, day, start_time, end_time, venue, lecturer) VALUES (?, ?, ?, ?, ?, ?, ?)').run(data.space.id, courseId, entry.day, entry.start_time, entry.end_time, entry.venue || null, entry.lecturer || null);
    }
  }

  for (const ann of data.announcements) {
    const courseId = ann.course_index >= 0 ? courseIds[ann.course_index] : null;
    await db.prepare(
      'INSERT INTO announcements (space_id, course_id, title, body, type, author_id, urgent, pinned, deadline, venue, instructions, submission_method, format) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      data.space.id, courseId, ann.title, ann.body, ann.type, repId,
      ann.urgent ? 1 : 0, ann.pinned ? 1 : 0,
      ann.deadline || null, ann.venue || null, ann.instructions || null,
      ann.submission_method || null, ann.format || null
    );
  }

  for (const mat of data.materials) {
    const courseId = courseIds[mat.course_index];
    await db.prepare('INSERT INTO materials (space_id, course_id, name, file_type, category, file_size, uploader_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(data.space.id, courseId, mat.name, mat.file_type, mat.category, mat.file_size, repId);
  }

  for (const poll of (data.polls || [])) {
    const res = await db.prepare('INSERT INTO polls (space_id, author_id, question, closes_at) VALUES (?, ?, ?, ?)').run(data.space.id, repId, poll.question, poll.closes_at || null);
    const pollId = res.lastInsertRowid;
    for (const [i, text] of poll.options.entries()) {
      await db.prepare('INSERT INTO poll_options (poll_id, text, display_order) VALUES (?, ?, ?)').run(pollId, text, i);
    }
  }

  for (const opp of (data.opportunities || [])) {
    await db.prepare(
      'INSERT INTO opportunities (space_id, author_id, title, description, category, link, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(data.space.id, repId, opp.title, opp.description, opp.category, opp.link || null, opp.deadline || null);
  }

  console.log('Default space (pre220) seeded successfully!');
}

if (process.argv[1] && (process.argv[1].includes('seed') || process.argv[1].endsWith('seed.ts'))) {
  seedDatabase()
    .catch(err => { console.error('Seed failed:', err); process.exit(1); });
}
