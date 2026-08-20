import { Request, Response, NextFunction } from 'express';
import pool from '../db/pool';
import { User } from '../types';

export interface AuthRequest extends Request {
  user?: User;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.session?.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'You must be logged in.' },
    });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT id, google_id, email, username, display_name, avatar_url, bio, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      req.session.destroy(() => {});
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not found.' },
      });
      return;
    }

    const row = result.rows[0];
    req.user = {
      id: row.id,
      googleId: row.google_id,
      email: row.email,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      bio: row.bio || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error.' },
    });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.session?.userId;

  if (!userId) {
    next();
    return;
  }

  try {
    const result = await pool.query(
      'SELECT id, google_id, email, username, display_name, avatar_url, bio, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      req.user = {
        id: row.id,
        googleId: row.google_id,
        email: row.email,
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        bio: row.bio || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }
    next();
  } catch (error) {
    next();
  }
};
