import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import pool from '../db/pool';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

const commentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many comments. Please slow down.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/polls/:id/comments
router.get('/', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: pollId } = req.params;
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = Math.min(parseInt(req.query.limit as string || '30', 10), 100);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT c.id, c.content, c.created_at, c.updated_at,
              u.id as user_id, u.username, u.display_name, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.poll_id = $1
       ORDER BY c.created_at ASC
       LIMIT $2 OFFSET $3`,
      [pollId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*)::int as total FROM comments WHERE poll_id = $1',
      [pollId]
    );

    const comments = result.rows.map((row: any) => ({
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: {
        id: row.user_id,
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
      },
    }));

    res.json({ success: true, data: { comments, total: countResult.rows[0].total, page, limit } });
  } catch (error) {
    console.error('GET /comments error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch comments.' } });
  }
});

// POST /api/polls/:id/comments
router.post(
  '/',
  requireAuth,
  commentRateLimit,
  [
    body('content')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Comment must be between 1 and 500 characters.'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg } });
      return;
    }

    const { id: pollId } = req.params;
    const { content } = req.body;

    try {
      // Verify poll exists
      const pollCheck = await pool.query('SELECT id FROM polls WHERE id = $1', [pollId]);
      if (pollCheck.rows.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Poll not found.' } });
        return;
      }

      const result = await pool.query(
        `INSERT INTO comments (poll_id, user_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, content, created_at, updated_at`,
        [pollId, req.user!.id, content.trim()]
      );

      const row = result.rows[0];
      const user = req.user!;

      res.status(201).json({
        success: true,
        data: {
          comment: {
            id: row.id,
            content: row.content,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            user: {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
            },
          },
        },
      });
    } catch (error) {
      console.error('POST /comments error:', error);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to post comment.' } });
    }
  }
);

export default router;
