import { Router, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import pool from '../db/pool';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const VALID_CATEGORIES = [
  'Football', 'Gaming', 'Music', 'Technology',
  'Fashion', 'School', 'Relationships', 'Entertainment', 'Food', 'Other'
];

// Helper to build full poll with options, votes, comment count
async function buildPollDetails(pollId: string, requestingUserId?: string) {
  const pollResult = await pool.query(
    `SELECT p.id, p.question, p.category, p.image_url, p.created_at, p.updated_at,
            u.id as creator_id, u.username, u.display_name, u.avatar_url
     FROM polls p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = $1`,
    [pollId]
  );

  if (pollResult.rows.length === 0) return null;

  const poll = pollResult.rows[0];

  const optionsResult = await pool.query(
    `SELECT po.id, po.option_text, po.position,
            COUNT(v.id)::int AS vote_count
     FROM poll_options po
     LEFT JOIN votes v ON v.option_id = po.id
     WHERE po.poll_id = $1
     GROUP BY po.id
     ORDER BY po.position ASC`,
    [pollId]
  );

  const totalVotes = optionsResult.rows.reduce((sum: number, o: any) => sum + o.vote_count, 0);

  const commentCountResult = await pool.query(
    'SELECT COUNT(*)::int as count FROM comments WHERE poll_id = $1',
    [pollId]
  );

  let userVotedOptionId: string | null = null;
  if (requestingUserId) {
    const voteResult = await pool.query(
      'SELECT option_id FROM votes WHERE poll_id = $1 AND user_id = $2',
      [pollId, requestingUserId]
    );
    if (voteResult.rows.length > 0) {
      userVotedOptionId = voteResult.rows[0].option_id;
    }
  }

  return {
    id: poll.id,
    question: poll.question,
    category: poll.category,
    imageUrl: poll.image_url,
    createdAt: poll.created_at,
    updatedAt: poll.updated_at,
    creator: {
      id: poll.creator_id,
      username: poll.username,
      displayName: poll.display_name,
      avatarUrl: poll.avatar_url,
    },
    options: optionsResult.rows.map((o: any) => ({
      id: o.id,
      optionText: o.option_text,
      position: o.position,
      voteCount: o.vote_count,
    })),
    totalVotes,
    commentCount: commentCountResult.rows[0].count,
    userVotedOptionId,
  };
}

// GET /api/polls
router.get('/', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg } });
    return;
  }

  const page = parseInt(req.query.page as string || '1', 10);
  const limit = Math.min(parseInt(req.query.limit as string || '20', 10), 50);
  const offset = (page - 1) * limit;
  const category = req.query.category as string;

  try {
    let queryStr = `
      SELECT p.id FROM polls p
      ${category && VALID_CATEGORIES.includes(category) ? 'WHERE p.category = $3' : ''}
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const params: any[] = [limit, offset];
    if (category && VALID_CATEGORIES.includes(category)) params.push(category);

    const pollIds = await pool.query(queryStr, params);

    const polls = await Promise.all(
      pollIds.rows.map((r: any) => buildPollDetails(r.id, req.user?.id))
    );

    res.json({ success: true, data: { polls, page, limit } });
  } catch (error) {
    console.error('GET /polls error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch polls.' } });
  }
});

// GET /api/polls/trending
router.get('/trending', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const category = req.query.category as string;
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = Math.min(parseInt(req.query.limit as string || '20', 10), 50);
  const offset = (page - 1) * limit;

  try {
    // Trending score = votes + (comments * 2) + recency bonus (decays over 48h)
    let queryStr = `
      SELECT p.id,
        (
          COUNT(DISTINCT v.id) +
          (COUNT(DISTINCT c.id) * 2) +
          GREATEST(0, 10 - EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600)::int
        ) AS trending_score
      FROM polls p
      LEFT JOIN votes v ON v.poll_id = p.id
      LEFT JOIN comments c ON c.poll_id = p.id
      ${category && VALID_CATEGORIES.includes(category) ? 'WHERE p.category = $3' : ''}
      GROUP BY p.id
      ORDER BY trending_score DESC, p.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const params: any[] = [limit, offset];
    if (category && VALID_CATEGORIES.includes(category)) params.push(category);

    const pollIds = await pool.query(queryStr, params);

    const polls = await Promise.all(
      pollIds.rows.map((r: any) => buildPollDetails(r.id, req.user?.id))
    );

    res.json({ success: true, data: { polls, page, limit } });
  } catch (error) {
    console.error('GET /polls/trending error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch trending polls.' } });
  }
});

// GET /api/polls/:id
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const poll = await buildPollDetails(id, req.user?.id);
    if (!poll) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Poll not found.' } });
      return;
    }
    res.json({ success: true, data: { poll } });
  } catch (error) {
    console.error('GET /polls/:id error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch poll.' } });
  }
});

// POST /api/polls
router.post(
  '/',
  requireAuth,
  [
    body('question')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Question must be between 5 and 200 characters.'),
    body('options')
      .isArray({ min: 2, max: 4 })
      .withMessage('Provide between 2 and 4 options.'),
    body('options.*')
      .trim()
      .notEmpty()
      .withMessage('Options cannot be empty.'),
    body('category')
      .optional()
      .isIn(VALID_CATEGORIES)
      .withMessage('Invalid category.'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg } });
      return;
    }

    const { question, options, category = 'Other', imageUrl } = req.body;

    // Check for duplicate options
    const trimmedOptions: string[] = options.map((o: string) => o.trim());
    const uniqueOptions = new Set(trimmedOptions.map((o: string) => o.toLowerCase()));
    if (uniqueOptions.size !== trimmedOptions.length) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Duplicate options are not allowed.' } });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const pollResult = await client.query(
        `INSERT INTO polls (user_id, question, category, image_url)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [req.user!.id, question.trim(), category, imageUrl || null]
      );

      const pollId = pollResult.rows[0].id;

      for (let i = 0; i < trimmedOptions.length; i++) {
        await client.query(
          'INSERT INTO poll_options (poll_id, option_text, position) VALUES ($1, $2, $3)',
          [pollId, trimmedOptions[i], i + 1]
        );
      }

      await client.query('COMMIT');

      const poll = await buildPollDetails(pollId, req.user!.id);
      res.status(201).json({ success: true, data: { poll } });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('POST /polls error:', error);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create poll.' } });
    } finally {
      client.release();
    }
  }
);

// DELETE /api/polls/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM polls WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Poll not found or not authorized.' } });
      return;
    }

    res.json({ success: true, data: { message: 'Poll deleted.' } });
  } catch (error) {
    console.error('DELETE /polls/:id error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete poll.' } });
  }
});

// POST /api/polls/:id/vote
router.post(
  '/:id/vote',
  requireAuth,
  [body('optionId').notEmpty().withMessage('optionId is required.')],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg } });
      return;
    }

    const { id: pollId } = req.params;
    const { optionId } = req.body;

    try {
      // Verify option belongs to this poll
      const optionCheck = await pool.query(
        'SELECT id FROM poll_options WHERE id = $1 AND poll_id = $2',
        [optionId, pollId]
      );

      if (optionCheck.rows.length === 0) {
        res.status(400).json({ success: false, error: { code: 'INVALID_OPTION', message: 'Invalid option for this poll.' } });
        return;
      }

      // Insert vote — unique constraint handles duplicate prevention
      await pool.query(
        'INSERT INTO votes (poll_id, option_id, user_id) VALUES ($1, $2, $3)',
        [pollId, optionId, req.user!.id]
      );

      const poll = await buildPollDetails(pollId, req.user!.id);
      res.json({ success: true, data: { poll } });
    } catch (error: any) {
      if (error.code === '23505') {
        // unique_violation — already voted
        res.status(409).json({ success: false, error: { code: 'ALREADY_VOTED', message: 'You have already voted on this poll.' } });
        return;
      }
      console.error('POST /polls/:id/vote error:', error);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to record vote.' } });
    }
  }
);

// GET /api/polls/:id/results
router.get('/:id/results', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const poll = await buildPollDetails(id, req.user?.id);
    if (!poll) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Poll not found.' } });
      return;
    }
    res.json({ success: true, data: { poll } });
  } catch (error) {
    console.error('GET /polls/:id/results error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch results.' } });
  }
});

export default router;
