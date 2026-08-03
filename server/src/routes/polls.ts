import { FastifyInstance } from 'fastify';
import { getDb, isSpaceMember } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { isNonEmptyString, isPositiveInt, fail } from '../lib/validate.js';
import { PollRow, PollOptionRow, PollVoteRow, MembershipRow } from '../db/rows.js';

export function pollRoutes(app: FastifyInstance) {
  app.get('/api/spaces/:id/polls', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    if (!await isSpaceMember(id, userId)) {
      return reply.status(403).send({ error: 'Not a member of this space' });
    }

    const db = getDb();

    const polls = await db.prepare<PollRow>(`
      SELECT p.*, u.name as author_name
      FROM polls p
      JOIN users u ON p.author_id = u.id
      WHERE p.space_id = ?
      ORDER BY p.created_at DESC
    `).all(id);

    if (polls.length === 0) return { polls: [] };

    const pollIds = polls.map(p => p.id);
    const placeholders = pollIds.map(() => '?').join(',');

    const allOptions = await db.prepare<PollOptionRow>(`
      SELECT po.id, po.poll_id, po.text, po.display_order,
        COUNT(pv.id) as votes
      FROM poll_options po
      LEFT JOIN poll_votes pv ON pv.option_id = po.id
      WHERE po.poll_id IN (${placeholders})
      GROUP BY po.id
      ORDER BY po.display_order
    `).all(...pollIds);

    const optionsByPoll = new Map<number, any[]>();
    for (const opt of allOptions) {
      if (!optionsByPoll.has(opt.poll_id)) {
        optionsByPoll.set(opt.poll_id, []);
      }
      optionsByPoll.get(opt.poll_id)!.push(opt);
    }

    let voteByPoll = new Map<number, number>();
    const myVotes = await db.prepare<PollVoteRow>(`
      SELECT poll_id, option_id FROM poll_votes
      WHERE poll_id IN (${placeholders}) AND user_id = ?
    `).all(...pollIds, userId);
    for (const v of myVotes) {
      voteByPoll.set(v.poll_id, v.option_id);
    }

    const enriched = polls.map((poll: any) => {
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

    const isMember = await db.prepare<MembershipRow>(
      'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?'
    ).get(id, userId);

    if (!isMember || isMember.role !== 'rep') {
      return reply.status(403).send({ error: 'Only class reps can create polls' });
    }

    if (!isNonEmptyString(body.question, 300)) {
      return fail(reply, 'Question is required (max 300 chars)');
    }
    const opts = (body.options || []).filter((o) => typeof o === 'string' && o.trim());
    if (opts.length < 2) {
      return fail(reply, 'At least 2 options are required');
    }
    if (opts.length > 10) {
      return fail(reply, 'Maximum 10 options per poll');
    }
    for (const o of opts) {
      if (o.length > 200) return fail(reply, 'Option text too long (max 200 chars)');
    }

    // last_insert_rowid() is clobbered by any subsequent INSERT in the same
    // batch (e.g. the first option row), so capture the poll id once into a
    // temp table and read it for every option row.
    const optionSelects = opts.map(() => 'SELECT id, ?, ? FROM _new_poll_id').join(' UNION ALL ');
    const stmts: ({ sql: string; args: any[] })[] = [
      {
        sql: 'INSERT INTO polls (space_id, author_id, question, closes_at) VALUES (?, ?, ?, ?)',
        args: [id, userId, body.question.trim(), body.closes_at || null],
      },
      {
        sql: 'CREATE TEMP TABLE _new_poll_id AS SELECT last_insert_rowid() AS id',
        args: [],
      },
      {
        sql: `INSERT INTO poll_options (poll_id, text, display_order) ${optionSelects}`,
        args: opts.flatMap((text, i) => [text.trim(), i]),
      },
      { sql: 'DROP TABLE _new_poll_id', args: [] },
    ];

    const results = await db.batch(stmts);
    const pollId = results[0].lastInsertRowid;

    const poll = await db.prepare(`
      SELECT p.*, u.name as author_name FROM polls p
      JOIN users u ON p.author_id = u.id WHERE p.id = ?
    `).get(pollId) as PollRow | null;

    const options = await db.prepare<PollOptionRow>(`
      SELECT po.id, po.text, po.display_order, 0 as votes
      FROM poll_options po WHERE po.poll_id = ? ORDER BY po.display_order
    `).all(pollId);

    return { poll: { ...poll, options, total_votes: 0, my_vote: null } };
  });

  app.post('/api/polls/:id/vote', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { option_id } = request.body as { option_id: number };
    const userId = request.user!.userId;
    const db = getDb();

    if (!isPositiveInt(option_id)) {
      return fail(reply, 'A valid option id is required');
    }

    const poll = await db.prepare<PollRow>('SELECT * FROM polls WHERE id = ?').get(Number(id));
    if (!poll) return reply.status(404).send({ error: 'Poll not found' });

    if (poll.closes_at && new Date(poll.closes_at as string) < new Date()) {
      return reply.status(400).send({ error: 'This poll is closed' });
    }

    const option = await db.prepare<PollOptionRow>('SELECT * FROM poll_options WHERE id = ? AND poll_id = ?').get(option_id, Number(id));
    if (!option) return reply.status(400).send({ error: 'Invalid option' });

    const existing = await db.prepare<PollVoteRow>('SELECT id FROM poll_votes WHERE poll_id = ? AND user_id = ?').get(Number(id), userId);
    if (existing) {
      await db.prepare('UPDATE poll_votes SET option_id = ? WHERE poll_id = ? AND user_id = ?').run(option_id, Number(id), userId);
    } else {
      await db.prepare('INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES (?, ?, ?)').run(Number(id), option_id, userId);
    }

    const options = await db.prepare<PollOptionRow>(`
      SELECT po.id, po.text, po.display_order, COUNT(pv.id) as votes
      FROM poll_options po
      LEFT JOIN poll_votes pv ON pv.option_id = po.id
      WHERE po.poll_id = ? GROUP BY po.id ORDER BY po.display_order
    `).all(Number(id));

    const totalVotes = options.reduce((s: number, o: any) => s + o.votes, 0);
    return { options, total_votes: totalVotes, voted_option_id: option_id };
  });

  app.delete('/api/polls/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const db = getDb();

    const poll = await db.prepare<PollRow>('SELECT * FROM polls WHERE id = ?').get(Number(id));
    if (!poll) return reply.status(404).send({ error: 'Not found' });

    const isMember = await db.prepare<MembershipRow>(
      'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?'
    ).get(poll.space_id, userId);

    if (!isMember || isMember.role !== 'rep') {
      return reply.status(403).send({ error: 'Only class reps can delete polls' });
    }

    await db.prepare('DELETE FROM polls WHERE id = ?').run(Number(id));
    return { success: true };
  });
}
