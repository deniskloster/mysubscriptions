const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDatabase() {
  const client = await pool.connect();

  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        first_name VARCHAR(255),
        default_currency VARCHAR(10) DEFAULT 'RUB',
        display_mode VARCHAR(20) DEFAULT 'converted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default categories
    await client.query(`
      INSERT INTO categories (name, icon) VALUES
        ('Entertainment', '🎬'),
        ('Music', '🎵'),
        ('Communication', '📱'),
        ('Cloud Storage', '☁️'),
        ('Fitness', '💪'),
        ('Other', '📦')
      ON CONFLICT DO NOTHING;
    `);

    // Create subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        icon VARCHAR(255),
        color VARCHAR(20) DEFAULT '#4A90E2',
        cycle VARCHAR(50) NOT NULL,
        first_bill DATE,
        remind_me VARCHAR(50) DEFAULT 'Never',
        duration VARCHAR(50) DEFAULT 'Forever',
        renewal_type VARCHAR(20) DEFAULT 'Автоматически',
        category_id INTEGER REFERENCES categories(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_next_bill ON subscriptions(first_bill) WHERE is_active = true;
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDatabase };