/**
 * Development seed data - DO NOT run in production.
 * This creates sample polls for local development/testing.
 */
import pool from './pool';
import { config } from '../config';

if (config.isProduction) {
  console.error('Seed script should not be run in production!');
  process.exit(1);
}

const seedData = async () => {
  const client = await pool.connect();
  try {
    console.log('Seeding development data...');

    // Create a test user
    const userResult = await client.query(`
      INSERT INTO users (google_id, email, username, display_name, avatar_url, bio)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (google_id) DO UPDATE SET username = EXCLUDED.username
      RETURNING id
    `, [
      'seed_google_id_001',
      'seed@voxly.app',
      'voxly_seed',
      'Voxly Team',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=voxly',
      'Official Voxly seed account for development.'
    ]);

    const userId = userResult.rows[0].id;

    // Sample polls
    const polls = [
      {
        question: 'Who is the GOAT? 🐐',
        category: 'Football',
        options: ['Lionel Messi', 'Cristiano Ronaldo', 'Pelé', 'Ronaldinho']
      },
      {
        question: 'Best music genre right now?',
        category: 'Music',
        options: ['Hip-Hop', 'Pop', 'R&B', 'Electronic']
      },
      {
        question: 'Pineapple on pizza — yes or no?',
        category: 'Food',
        options: ['Yes, it slaps 🍍', 'Absolutely not 🚫']
      },
      {
        question: 'What\'s the best gaming platform in 2026?',
        category: 'Gaming',
        options: ['PlayStation 5', 'Xbox Series X', 'Nintendo Switch', 'PC Master Race']
      },
      {
        question: 'Which social media platform do you use most?',
        category: 'Technology',
        options: ['Instagram', 'TikTok', 'X (Twitter)', 'YouTube']
      },
    ];

    for (const poll of polls) {
      const pollResult = await client.query(`
        INSERT INTO polls (user_id, question, category)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [userId, poll.question, poll.category]);

      const pollId = pollResult.rows[0].id;

      for (let i = 0; i < poll.options.length; i++) {
        await client.query(`
          INSERT INTO poll_options (poll_id, option_text, position)
          VALUES ($1, $2, $3)
        `, [pollId, poll.options[i], i + 1]);
      }
    }

    console.log('Seed data inserted successfully.');
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seedData().catch((err) => {
  console.error(err);
  process.exit(1);
});
