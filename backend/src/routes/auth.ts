import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { body, validationResult } from 'express-validator';
import pool from '../db/pool';
import { config } from '../config';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const googleClient = new OAuth2Client(config.googleClientId);

function generateUsername(email: string, displayName: string): string {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return base ? `${base}${suffix}` : `user${suffix}`;
}

// POST /api/auth/google
// Accepts a Google ID token from the frontend and creates/logs in the user
router.post(
  '/google',
  [body('token').notEmpty().withMessage('Google token is required.')],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg },
      });
      return;
    }

    const { token } = req.body;

    try {
      // Verify the Google ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: config.googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Invalid Google token.' },
        });
        return;
      }

      const { sub: googleId, email, name, picture } = payload;

      // Upsert user
      let user = await pool.query(
        'SELECT * FROM users WHERE google_id = $1',
        [googleId]
      );

      if (user.rows.length === 0) {
        // Create new user
        const username = generateUsername(email, name || email);
        const displayName = name || email.split('@')[0];

        let finalUsername = username;
        // Ensure username is unique
        let attempt = 0;
        while (attempt < 10) {
          const existing = await pool.query(
            'SELECT id FROM users WHERE username = $1',
            [finalUsername]
          );
          if (existing.rows.length === 0) break;
          finalUsername = `${username}${Math.floor(Math.random() * 900) + 100}`;
          attempt++;
        }

        const insertResult = await pool.query(
          `INSERT INTO users (google_id, email, username, display_name, avatar_url, bio)
           VALUES ($1, $2, $3, $4, $5, '')
           RETURNING *`,
          [googleId, email, finalUsername, displayName, picture || null]
        );
        user = insertResult;
      } else {
        // Update avatar if changed
        await pool.query(
          'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE google_id = $2',
          [picture || null, googleId]
        );
        user = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
      }

      const row = user.rows[0];

      // Set session
      req.session.userId = row.id;

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: row.id,
            email: row.email,
            username: row.username,
            displayName: row.display_name,
            avatarUrl: row.avatar_url,
            bio: row.bio || '',
            createdAt: row.created_at,
          },
        },
      });
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Authentication failed.' },
      });
    }
  }
);

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthRequest, res: Response): void => {
  const user = req.user!;
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    },
  });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Logout failed.' },
      });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, data: { message: 'Logged out successfully.' } });
  });
});

export default router;
