import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import connectPgSimple from 'connect-pg-simple';
import pool from './db/pool';
import { config } from './config';
import authRoutes from './routes/auth';
import pollRoutes from './routes/polls';
import commentRoutes from './routes/comments';
import deleteCommentRoutes from './routes/deleteComment';
import userRoutes from './routes/users';
import { notFound, errorHandler } from './middleware/errorHandler';

const app = express();
const PgSession = connectPgSimple(session);

// Trust proxy — needed for Render deployment and correct rate-limit IP detection.
// In local dev with no proxy this is harmless.
app.set('trust proxy', 1);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS — allow frontend origin with credentials for cookie-based sessions
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Session stored in PostgreSQL
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.isProduction,      // HTTPS only in prod
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: config.isProduction ? 'none' : 'lax',
    },
  })
);

// Global rate limit
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
  },
});
app.use(globalRateLimit);

// Stricter rate limit for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many auth attempts. Please try again later.' },
  },
});

// ── Routes ──────────────────────────────────────────────────────────────────
// NOTE: comment routes use mergeParams:true so they receive :id from the parent
// path. They must be mounted BEFORE the generic /api/polls router so Express
// matches the more-specific path first.
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/polls/:id/comments', commentRoutes);  // mergeParams child
app.use('/api/polls', pollRoutes);
app.use('/api/comments', deleteCommentRoutes);
app.use('/api/users', userRoutes);

// Health check (unauthenticated)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 + global error handler (must be last)
app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🚀 Voxly API running on port ${config.port} [${config.nodeEnv}]`);
});

export default app;
