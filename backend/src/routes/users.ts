import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// IMPORTANT: /me and /me/polls must be declared BEFORE /:username
// otherwise the wildcard will capture "me" as a username.

// PUT /api/users/me
router.put(
  '/me',
  requireAuth,
  [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-30 characters, letters/numbers/underscores only.'),
    body('displayName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Display name must be 1-100 characters.'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Bio must be 200 characters or less.'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg } });
      return;
    }

    const { username, displayName, bio } = req.body;
    const userId = req.user!.id;

    try {
      // Check if new username is taken
      if (username) {
        const existing = await pool.query(
          'SELECT id FROM users WHERE username = $1 AND id != $2',
          [username, userId]
        );
        if (existing.rows.length > 0) {
          res.status(409).json({ success: false, error: { code: 'USERNAME_TAKEN', message: 'Username is already taken.' } });
          return;
        }
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIdx = 1;

      if (username !== undefined) { updates.push(`username = $${paramIdx++}`); values.push(username); }
      if (displayName !== undefined) { updates.push(`display_name = $${paramIdx++}`); values.push(displayName); }
      if (bio !== undefined) { updates.push(`bio = $${paramIdx++}`); values.push(bio); }

      if (updates.length === 0) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No fields to update.' } });
        return;
      }

      updates.push(`updated_at = NOW()`);
      values.push(userId);

      const result = await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING id, username, display_name, avatar_url, bio, updated_at`,
        values
      );

      const row = result.rows[0];
      res.json({
        success: true,
        data: {
          user: {
            id: row.id,
            username: row.username,
            displayName: row.display_name,
            avatarUrl: row.avatar_url,
            bio: row.bio || '',
            updatedAt: row.updated_at,
          },
        },
      });
    } catch (error) {
      console.error('PUT /users/me error:', error);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update profile.' } });
    }
  }
);

// GET /api/users/me/polls
router.get('/me/polls', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = Math.min(parseInt(req.query.limit as string || '20', 10), 50);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT p.id, p.question, p.category, p.created_at,
              COUNT(DISTINCT v.id)::int AS vote_count,
              COUNT(DISTINCT c.id)::int AS comment_count
       FROM polls p
       LEFT JOIN votes v ON v.poll_id = p.id
       LEFT JOIN comments c ON c.poll_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      data: {
        polls: result.rows.map((p: any) => ({
          id: p.id,
          question: p.question,
          category: p.category,
          createdAt: p.created_at,
          voteCount: p.vote_count,
          commentCount: p.comment_count,
        })),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('GET /users/me/polls error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch polls.' } });
  }
});

// GET /api/users/:username  — must come AFTER /me routes
router.get('/:username', async (req: AuthRequest, res: Response): Promise<void> => {
  const { username } = req.params;

  try {
    const userResult = await pool.query(
      `SELECT id, username, display_name, avatar_url, bio, created_at
       FROM users WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } });
      return;
    }

    const user = userResult.rows[0];

    const statsResult = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM polls WHERE user_id = $1) AS poll_count,
        (SELECT COUNT(*)::int FROM votes v JOIN polls p ON v.poll_id = p.id WHERE p.user_id = $1) AS votes_received`,
      [user.id]
    );

    const pollsResult = await pool.query(
      `SELECT p.id FROM polls p WHERE p.user_id = $1 ORDER BY p.created_at DESC LIMIT 20`,
      [user.id]
    );

    const polls = await Promise.all(
      pollsResult.rows.map(async (row: any) => {
        const p = await pool.query(
          `SELECT p.id, p.question, p.category, p.created_at,
                  COUNT(DISTINCT v.id)::int AS vote_count,
                  COUNT(DISTINCT c.id)::int AS comment_count
           FROM polls p
           LEFT JOIN votes v ON v.poll_id = p.id
           LEFT JOIN comments c ON c.poll_id = p.id
           WHERE p.id = $1
           GROUP BY p.id`,
          [row.id]
        );
        return p.rows[0];
      })
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          bio: user.bio || '',
          createdAt: user.created_at,
          pollCount: statsResult.rows[0].poll_count,
          votesReceived: statsResult.rows[0].votes_received,
        },
        polls: polls.map((p: any) => ({
          id: p.id,
          question: p.question,
          category: p.category,
          createdAt: p.created_at,
          voteCount: p.vote_count,
          commentCount: p.comment_count,
        })),
      },
    });
  } catch (error) {
    console.error('GET /users/:username error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch user.' } });
  }
});

export default router;
