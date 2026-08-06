import { FastifyInstance } from 'fastify';
import { getDb, isSpaceMember } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { sendPushToSpaceMembers } from '../lib/push.js';
import { uploadFile, uploadFileBuffer, deleteFileByUrl } from '../lib/upload.js';
import { isNonEmptyString, fail } from '../lib/validate.js';
import { AnnouncementRow, ReactionRow, MyReactionRow, AttachmentRow, MembershipRow, SpaceRow } from '../db/rows.js';

export function announcementRoutes(app: FastifyInstance) {
  app.get('/api/spaces/:id/announcements', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as { filter?: string };
    const userId = request.user!.userId;

    if (!await isSpaceMember(id, userId)) {
      return reply.status(403).send({ error: 'Not a member of this space' });
    }

    const db = getDb();

    let sql = `
      SELECT a.*,
        u.name as author_name,
        c.name as course_name, c.code as course_code, c.icon as course_icon
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE a.space_id = ?
    `;
    const params: any[] = [id];

    if (query.filter === 'urgent') {
      sql += ' AND a.urgent = 1';
    } else if (query.filter === 'pinned') {
      sql += ' AND a.pinned = 1';
    } else if (query.filter && query.filter !== 'all') {
      sql += ' AND c.code = ?';
      params.push(query.filter);
    }

    sql += ' ORDER BY a.pinned DESC, a.urgent DESC, a.created_at DESC';

    const rows = await db.prepare<AnnouncementRow>(sql).all(...params);

    const ids = rows.map(r => r.id);
    if (ids.length === 0) return { announcements: [] };

    const placeholders = ids.map(() => '?').join(',');
    const reactions = await db.prepare<ReactionRow>(`
      SELECT announcement_id, emoji, COUNT(*) as count
      FROM reactions
      WHERE announcement_id IN (${placeholders})
      GROUP BY announcement_id, emoji
    `).all(...ids);


    const reactionMap = new Map<number, { upvote: number; downvote: number }>();
    for (const r of reactions) {
      if (!reactionMap.has(r.announcement_id)) {
        reactionMap.set(r.announcement_id, { upvote: 0, downvote: 0 });
      }
      const map = reactionMap.get(r.announcement_id)!;
      if (r.emoji === 'upvote') map.upvote = r.count;
      if (r.emoji === 'downvote') map.downvote = r.count;
    }

    let myReactionMap = new Map<number, string>();
    const myVotes = await db.prepare<MyReactionRow>(`
      SELECT announcement_id, emoji FROM reactions
      WHERE announcement_id IN (${placeholders}) AND user_id = ?
    `).all(...ids, userId);
    for (const v of myVotes) {
      myReactionMap.set(v.announcement_id, v.emoji);
    }

    const announcements = rows.map((r) => {
      const react = reactionMap.get(r.id) ?? { upvote: 0, downvote: 0 };
      return {
        ...r,
        urgent: Boolean(r.urgent),
        pinned: Boolean(r.pinned),
        reactions: react,
        my_reaction: myReactionMap.get(r.id) ?? null,
      };
    });
    return { announcements };
  });

  app.post('/api/spaces/:id/announcements', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const db = getDb();
    const ct = request.headers['content-type'] || '';

    // Reject non-rep users before any expensive file uploads happen.
    const membership = await db.prepare<MembershipRow>(
      'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?'
    ).get(id, userId);
    if (!membership || membership.role !== 'rep') {
      return reply.status(403).send({ error: 'Only class reps can create announcements' });
    }

    const uploadedUrls: string[] = [];

    let courseId: number | null = null;
    let title = '';
    let body = '';
    let type = 'announcement';
    let urgent = false;
    let pinned = false;
    let deadline: string | null = null;
    let venue: string | null = null;
    let instructions: string | null = null;
    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    const attachments: { fileUrl: string; fileName: string; fileSize: number }[] = [];

    if (ct.includes('multipart/form-data')) {
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'file') {
          const buffer = await part.toBuffer();
          if (buffer.length > 0) {
            const result = await uploadFileBuffer(buffer, part.filename, part.mimetype);
            uploadedUrls.push(result.url);
            attachments.push({ fileUrl: result.url, fileName: part.filename, fileSize: buffer.length });
          }
          continue;
        }
        const value = String((part as any).value ?? '');
        switch (part.fieldname) {
          case 'title': title = value; break;
          case 'body': body = value; break;
          case 'type': type = value || 'announcement'; break;
          case 'urgent': urgent = value === 'true'; break;
          case 'pinned': pinned = value === 'true'; break;
          case 'course_id': courseId = value ? Number(value) : null; break;
          case 'deadline': deadline = value || null; break;
          case 'venue': venue = value || null; break;
          case 'instructions': instructions = value || null; break;
        }
      }
      if (attachments.length > 0) {
        fileUrl = attachments[0].fileUrl;
        fileName = attachments[0].fileName;
        fileSize = attachments[0].fileSize;
      }
    } else {
      const json = request.body as any;
      title = json.title;
      body = json.body;
      type = json.type || 'announcement';
      urgent = !!json.urgent;
      pinned = !!json.pinned;
      courseId = json.course_id || null;
      deadline = json.deadline || null;
      venue = json.venue || null;
      instructions = json.instructions || null;
      if (Array.isArray(json.files)) {
        for (const f of json.files) {
          if (f?.file_url) {
            attachments.push({
              fileUrl: String(f.file_url),
              fileName: String(f.file_name || 'file'),
              fileSize: Number(f.file_size) || 0,
            });
          }
        }
        if (attachments.length > 0) {
          fileUrl = attachments[0].fileUrl;
          fileName = attachments[0].fileName;
          fileSize = attachments[0].fileSize;
        }
      } else if (json.file_data) {
        const result = await uploadFile(json.file_data, json.file_name || 'file.bin');
        fileUrl = result.url;
        fileName = json.file_name || null;
        fileSize = json.file_size || null;
      }
    }

    if (!isNonEmptyString(title, 200) || !isNonEmptyString(body, 10000)) {
      for (const url of uploadedUrls) await deleteFileByUrl(url);
      return fail(reply, 'Title (max 200 chars) and body (max 10,000 chars) are required');
    }

    // last_insert_rowid() is clobbered by any subsequent INSERT in the same
    // batch (e.g. the first attachment row), so capture the announcement id
    // once into a temp table and read it for every attachment row.
    const attachmentSelects = attachments.map(() => 'SELECT id, ?, ?, ? FROM _new_ann_id').join(' UNION ALL ');
    const stmts: ({ sql: string; args: any[] })[] = [
      {
        sql: `INSERT INTO announcements (space_id, course_id, title, body, type, author_id, urgent, pinned, deadline, venue, instructions, submission_method, format, file_data, file_name, file_size)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, courseId, title, body, type, userId, urgent ? 1 : 0, pinned ? 1 : 0, deadline, venue, instructions, null, null, fileUrl, fileName, fileSize],
      },
      {
        sql: 'CREATE TEMP TABLE _new_ann_id AS SELECT last_insert_rowid() AS id',
        args: [],
      },
      ...(attachments.length > 0 ? [{
        sql: `INSERT INTO announcement_attachments (announcement_id, file_url, file_name, file_size) ${attachmentSelects}`,
        args: attachments.flatMap(att => [att.fileUrl, att.fileName, att.fileSize]),
      }] : []),
      { sql: 'DROP TABLE _new_ann_id', args: [] },
    ];

    const results = await db.batch(stmts);
    const annId = results[0].lastInsertRowid;

    const ann = await db.prepare(`
      SELECT a.*, u.name as author_name, c.name as course_name, c.code as course_code
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE a.id = ?
    `).get(annId) as AnnouncementRow | null;

    const attachmentRows = await db.prepare<AttachmentRow>(
      'SELECT id, file_name, file_size FROM announcement_attachments WHERE announcement_id = ? ORDER BY id'
    ).all(annId);

    const authorName = ann?.author_name || 'Someone';
    const prefix = urgent ? '🚨' : '📢';
    sendPushToSpaceMembers(id, {
      title: `${prefix} ${title}`,
      body: `${authorName} — ${ann?.course_code || 'General'}`,
      tag: `announcement-${annId}`,
      data: { url: `/space/${id}/announcement/${annId}`, type: 'announcement' },
      requireInteraction: !!urgent,
    }).catch(() => {});

    return {
      announcement: {
        ...ann,
        urgent: Boolean(ann?.urgent),
        pinned: Boolean(ann?.pinned),
        reactions: { upvote: 0, downvote: 0 },
        my_reaction: null,
        attachments: attachmentRows.map(a => ({
          id: a.id,
          file_name: a.file_name,
          file_size: a.file_size,
          url: `/api/announcements/${annId}/attachment/${a.id}/download`,
        })),
      }
    };
  });

  app.get('/api/announcements/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const ann = await db.prepare(`
      SELECT a.*, u.name as author_name, c.name as course_name, c.code as course_code, c.icon as course_icon,
        s.name as space_name, s.id as space_id
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN courses c ON a.course_id = c.id
      JOIN spaces s ON a.space_id = s.id
      WHERE a.id = ?
    `).get(id) as AnnouncementRow | null;

    if (!ann) return reply.status(404).send({ error: 'Announcement not found' });

    const attachments = await db.prepare<AttachmentRow>(
      'SELECT id, file_name, file_size FROM announcement_attachments WHERE announcement_id = ? ORDER BY id'
    ).all(Number(id));

    return {
      ...ann,
      attachments: attachments.map(a => ({
        id: a.id,
        file_name: a.file_name,
        file_size: a.file_size,
        url: `/api/announcements/${id}/attachment/${a.id}/download`,
      })),
    };
  });

  app.get('/api/announcements/:id/attachment/:attId/download', async (request, reply) => {
    const { id, attId } = request.params as { id: string; attId: string };
    const db = getDb();

    const att = await db.prepare<AttachmentRow>(
      'SELECT file_url FROM announcement_attachments WHERE id = ? AND announcement_id = ?'
    ).get(Number(attId), Number(id));

    if (!att || !att.file_url) return reply.status(404).send({ error: 'File not found' });
    return reply.redirect(att.file_url);
  });

  app.delete('/api/announcements/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const db = getDb();

    const ann = await db.prepare<AnnouncementRow>('SELECT id, space_id, author_id, file_data FROM announcements WHERE id = ?').get(Number(id));
    if (!ann) return reply.status(404).send({ error: 'Not found' });

    const isRep = await db.prepare(
      'SELECT 1 FROM space_members WHERE space_id = ? AND user_id = ? AND role = ?'
    ).get(ann.space_id, userId, 'rep');

    if (ann.author_id !== userId && !isRep) {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    const attachments = await db.prepare<AttachmentRow>(
      'SELECT file_url FROM announcement_attachments WHERE announcement_id = ?'
    ).all(Number(id));
    await db.prepare('DELETE FROM announcement_attachments WHERE announcement_id = ?').run(Number(id));
    await db.prepare('DELETE FROM announcements WHERE id = ?').run(Number(id));

    await Promise.allSettled([
      deleteFileByUrl(ann.file_data),
      ...attachments.map((a) => deleteFileByUrl(a.file_url)),
    ]);

    return { success: true };
  });

  app.patch('/api/announcements/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const body = request.body as Record<string, unknown>;
    const db = getDb();

    const ann = await db.prepare<AnnouncementRow>('SELECT id, space_id, file_data FROM announcements WHERE id = ?').get(Number(id));
    if (!ann) return reply.status(404).send({ error: 'Not found' });

    const isRep = await db.prepare(
      'SELECT 1 FROM space_members WHERE space_id = ? AND user_id = ? AND role = ?'
    ).get(ann.space_id, userId, 'rep');
    if (!isRep) return reply.status(403).send({ error: 'Not authorized' });

    const fields: string[] = [];
    const vals: any[] = [];

    if (body.pinned !== undefined) { fields.push('pinned = ?'); vals.push(body.pinned ? 1 : 0); }
    if (body.urgent !== undefined) { fields.push('urgent = ?'); vals.push(body.urgent ? 1 : 0); }
    if (body.title !== undefined) { fields.push('title = ?'); vals.push(body.title); }
    if (body.body !== undefined) { fields.push('body = ?'); vals.push(body.body); }
    if (body.type !== undefined) { fields.push('type = ?'); vals.push(body.type); }
    if (body.course_id !== undefined) { fields.push('course_id = ?'); vals.push(body.course_id); }
    if (body.file_data !== undefined && typeof body.file_data === 'string') {
      const uploadName = typeof body.file_name === 'string' ? body.file_name : 'file.bin';
      const { url } = await uploadFile(body.file_data, uploadName);
      deleteFileByUrl(ann.file_data);
      fields.push('file_data = ?');
      vals.push(url);
    }
    if (body.file_name !== undefined) { fields.push('file_name = ?'); vals.push(body.file_name); }
    if (body.file_size !== undefined) { fields.push('file_size = ?'); vals.push(body.file_size); }

    if (fields.length > 0) {
      vals.push(Number(id));
      await db.prepare(`UPDATE announcements SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
    }

    return { success: true };
  });

  app.get('/api/announcements/:id/download', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const ann = await db.prepare<AnnouncementRow>('SELECT file_data, file_name FROM announcements WHERE id = ?').get(Number(id));
    if (!ann || !ann.file_data) return reply.status(404).send({ error: 'File not found' });

    return reply.redirect(ann.file_data);
  });

  app.get('/api/announcements/shared/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const announcement = await db.prepare(`
      SELECT a.*, u.name as author_name, c.name as course_name, c.code as course_code, c.icon as course_icon,
             s.name as space_name, s.dept, s.level, s.uni, s.id as space_id
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN courses c ON a.course_id = c.id
      JOIN spaces s ON a.space_id = s.id
      WHERE a.id = ?
    `).get(id) as AnnouncementRow | null;

    if (!announcement) return reply.status(404).send({ error: 'Announcement not found' });
    return announcement;
  });
}
