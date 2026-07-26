import { FastifyInstance } from 'fastify';
import { getDb } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

export function pollRoutes(app: FastifyInstance) {
  app.get('/api/spaces/:id/polls', async (request) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    let userId: number | null = null;
    try {
      const auth = request.headers.authorization;
      if (auth) {
        const { verifyToken } = await import('../lib/jwt.js');
        const payload = verifyToken(auth.replace('Bearer ', ''));
        if (payload) userId = (payload as any).userId;
      }
    } catch { /* no auth — fine */ }

    const polls = db.prepare(`
      SELECT p.*, u.name as author_name
      FROM polls p
      JOIN users u ON p.author_id = u.id
      WHERE p.space_id = ?
      ORDER BY p.created_at DESC
    `).all(id) as any[];

    if (polls.length === 0) return { polls: [] };

    // Batch fetch all options for all polls (2 queries total, no N+1)
    const pollIds = polls.map(p => p.id);
    const placeholders = pollIds.map(() => '?').join(',');

    const allOptions = db.prepare(`
      SELECT po.id, po.poll_id, po.text, po.display_order,
        COUNT(pv.id) as votes
      FROM poll_options po
      LEFT JOIN poll_votes pv ON pv.option_id = po.id
      WHERE po.poll_id IN (${placeholders})
      GROUP BY po.id
      ORDER BY po.display_order
    `).all(...pollIds) as any[];

    // Group options by poll_id
    const optionsByPoll = new Map<number, any[]>();
    for (const opt of allOptions) {
      if (!optionsByPoll.has(opt.poll_id)) {
        optionsByPoll.set(opt.poll_id, []);
      }
      optionsByPoll.get(opt.poll_id)!.push(opt);
    }

    // Batch fetch this user's votes
    let voteByPoll = new Map<number, number>();
    if (userId) {
      const myVotes = db.prepare(`
        SELECT poll_id, option_id FROM poll_votes
        WHERE poll_id IN (${placeholders}) AND user_id = ?
      `).all(...pollIds, userId) as any[];
      for (const v of myVotes) {
        voteByPoll.set(v.poll_id, v.option_id);
      }
    }

    const enriched = polls.map((poll) => {
      const options = optionsByPoll.get(poll.id) ?? [];
      const totalVotes = options.reduce((s: number, o: any) => s + o.votes, 0);
      return {
        ...poll,
        options,
        total_votes: totalVotes,
        my_vote: voteByPoll.get(poll.id) ?? null,
      };
    });

    return { polls: enriched };
  });

  app.post('/api/spaces/:id/polls', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { question: string; options: string[]; closes_at?: string };
    const userId = request.user!.userId;
    const db = getDb();

    const isMember = db.prepare(
      'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?'
    ).get(id, userId) as any;

    if (!isMember || isMember.role !== 'rep') {
      return reply.status(403).send({ error: 'Only class reps can create polls' });
    }

    if (!body.question?.trim()) {
      return reply.status(400).send({ error: 'Question is required' });
    }
    const opts = (body.options || []).filter((o) => o?.trim());
    if (opts.length < 2) {
      return reply.status(400).send({ error: 'At least 2 options are required' });
    }

    const result = db.prepare(
      'INSERT INTO polls (space_id, author_id, question, closes_at) VALUES (?, ?, ?, ?)'
    ).run(id, userId, body.question.trim(), body.closes_at || null);

    const pollId = result.lastInsertRowid as number;
    const insertOpt = db.prepare('INSERT INTO poll_options (poll_id, text, display_order) VALUES (?, ?, ?)');
    opts.forEach((text, i) => insertOpt.run(pollId, text.trim(), i));

    const poll = db.prepare(`
      SELECT p.*, u.name as author_name FROM polls p
      JOIN users u ON p.author_id = u.id WHERE p.id = ?
    `).get(pollId) as any;

    const options = db.prepare(`
      SELECT po.id, po.text, po.display_order, 0 as votes
      FROM poll_options po WHERE po.poll_id = ? ORDER BY po.display_order
    `).all(pollId) as any[];

    return { poll: { ...poll, options, total_votes: 0, my_vote: null } };
  });

  app.post('/api/polls/:id/vote', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { option_id } = request.body as { option_id: number };
    const userId = request.user!.userId;
    const db = getDb();

    const poll = db.prepare('SELECT * FROM polls WHERE id = ?').get(Number(id)) as any;
    if (!poll) return reply.status(404).send({ error: 'Poll not found' });

    if (poll.closes_at && new Date(poll.closes_at) < new Date()) {
      return reply.status(400).send({ error: 'This poll is closed' });
    }

    const option = db.prepare('SELECT * FROM poll_options WHERE id = ? AND poll_id = ?').get(option_id, Number(id)) as any;
    if (!option) return reply.status(400).send({ error: 'Invalid option' });

    const existing = db.prepare('SELECT id FROM poll_votes WHERE poll_id = ? AND user_id = ?').get(Number(id), userId) as any;
    if (existing) {
      db.prepare('UPDATE poll_votes SET option_id = ? WHERE poll_id = ? AND user_id = ?').run(option_id, Number(id), userId);
    } else {
      db.prepare('INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES (?, ?, ?)').run(Number(id), option_id, userId);
    }

    const options = db.prepare(`
      SELECT po.id, po.text, po.display_order, COUNT(pv.id) as votes
      FROM poll_options po
      LEFT JOIN poll_votes pv ON pv.option_id = po.id
      WHERE po.poll_id = ? GROUP BY po.id ORDER BY po.display_order
    `).all(Number(id)) as any[];

    const totalVotes = options.reduce((s: number, o: any) => s + o.votes, 0);
    return { options, total_votes: totalVotes, voted_option_id: option_id };
  });

  app.delete('/api/polls/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const db = getDb();

    const poll = db.prepare('SELECT * FROM polls WHERE id = ?').get(Number(id)) as any;
    if (!poll) return reply.status(404).send({ error: 'Not found' });

    const isMember = db.prepare(
      'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?'
    ).get(poll.space_id, userId) as any;

    if (!isMember || isMember.role !== 'rep') {
      return reply.status(403).send({ error: 'Only class reps can delete polls' });
    }

    db.prepare('DELETE FROM polls WHERE id = ?').run(Number(id));
    return { success: true };
  });
}
