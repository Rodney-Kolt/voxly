import { Pool } from 'pg';
import { config } from '../config';

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.isProduction ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit immediately - let the app continue and fail gracefully
  // This allows Render to still serve the /health endpoint even if DB is down
});

export default pool;
