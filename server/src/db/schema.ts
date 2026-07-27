import { getDb } from './connection.js';

export function createTables(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS spaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      dept TEXT NOT NULL,
      level TEXT NOT NULL,
      uni TEXT NOT NULL,
      rep_id INTEGER NOT NULL REFERENCES users(id),
      invite_code TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS space_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id TEXT NOT NULL REFERENCES spaces(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(space_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id TEXT NOT NULL REFERENCES spaces(id),
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      icon TEXT NOT NULL,
      color_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id TEXT NOT NULL REFERENCES spaces(id),
      course_id INTEGER REFERENCES courses(id),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'announcement',
      author_id INTEGER NOT NULL REFERENCES users(id),
      urgent INTEGER NOT NULL DEFAULT 0,
      pinned INTEGER NOT NULL DEFAULT 0,
      deadline TEXT,
      venue TEXT,
      instructions TEXT,
      submission_method TEXT,
      format TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id TEXT NOT NULL REFERENCES spaces(id),
      course_id INTEGER NOT NULL REFERENCES courses(id),
      name TEXT NOT NULL,
      file_data TEXT,
      file_size INTEGER,
      file_type TEXT NOT NULL DEFAULT 'other',
      category TEXT NOT NULL DEFAULT 'Other',
      uploader_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      emoji TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(announcement_id, user_id, emoji)
    );

    CREATE TABLE IF NOT EXISTS timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id TEXT NOT NULL REFERENCES spaces(id),
      course_id INTEGER NOT NULL REFERENCES courses(id),
      day TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      venue TEXT,
      lecturer TEXT
    );

    CREATE TABLE IF NOT EXISTS polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id TEXT NOT NULL REFERENCES spaces(id),
      author_id INTEGER NOT NULL REFERENCES users(id),
      question TEXT NOT NULL,
      closes_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS poll_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS poll_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      option_id INTEGER NOT NULL REFERENCES poll_options(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      voted_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(poll_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id TEXT NOT NULL REFERENCES spaces(id),
      author_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      link TEXT,
      deadline TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_ann_space ON announcements(space_id);
    CREATE INDEX IF NOT EXISTS idx_ann_course ON announcements(course_id);
    CREATE INDEX IF NOT EXISTS idx_mat_course ON materials(course_id);
    CREATE INDEX IF NOT EXISTS idx_mat_space ON materials(space_id);
    CREATE INDEX IF NOT EXISTS idx_reactions_ann ON reactions(announcement_id);
    CREATE INDEX IF NOT EXISTS idx_timetable_space ON timetable(space_id);
    CREATE INDEX IF NOT EXISTS idx_polls_space ON polls(space_id);
    CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id);
    CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(endpoint)
    );

    CREATE INDEX IF NOT EXISTS idx_opportunities_space ON opportunities(space_id);
    CREATE INDEX IF NOT EXISTS idx_space_members_user ON space_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_push_space ON push_subscriptions(space_id);
  `);
}
