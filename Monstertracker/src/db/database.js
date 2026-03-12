const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV==="production"?{rejectUnauthorized:false}:false });
const query = (text, params) => pool.query(text, params);

const init = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, username TEXT NOT NULL UNIQUE, email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
      theme TEXT NOT NULL DEFAULT 'dark', plain_password TEXT, user_code TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS cans (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, series TEXT, variant TEXT,
      cap_color TEXT, full_color TEXT, language TEXT, volume TEXT,
      country TEXT, year INTEGER, image_url TEXT, description TEXT,
      price NUMERIC(10,2), purchase_type TEXT, is_limited BOOLEAN NOT NULL DEFAULT FALSE,
      is_published BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS collections (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      can_id  INTEGER NOT NULL REFERENCES cans(id)  ON DELETE CASCADE,
      added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(user_id, can_id)
    );
    CREATE TABLE IF NOT EXISTS wishlists (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      can_id  INTEGER NOT NULL REFERENCES cans(id)  ON DELETE CASCADE,
      PRIMARY KEY(user_id, can_id)
    );
    CREATE TABLE IF NOT EXISTS friends (
      user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY(user_id, friend_id)
    );
    CREATE TABLE IF NOT EXISTS app_updates (
      id SERIAL PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      can_id  INTEGER NOT NULL REFERENCES cans(id)  ON DELETE CASCADE,
      position INTEGER NOT NULL CHECK(position IN (1,2,3)), PRIMARY KEY(user_id, position)
    );
    CREATE TABLE IF NOT EXISTS friend_requests (
      id SERIAL PRIMARY KEY,
      from_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      to_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status  TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(from_id, to_id)
    );
    CREATE TABLE IF NOT EXISTS chats (
      id SERIAL PRIMARY KEY,
      user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user1_id, user2_id)
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      chat_id  INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content  TEXT NOT NULL,
      seen     BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS user_cans (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      can_id  INTEGER NOT NULL REFERENCES cans(id)  ON DELETE CASCADE,
      purchase_type TEXT,
      price NUMERIC(10,2),
      UNIQUE(user_id, can_id)
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      username TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      attachment_url TEXT,
      reply TEXT,
      replied_at TIMESTAMPTZ,
      seen_reply BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  // Migrations
  const migrations = [
    `UPDATE users SET user_code = LPAD(floor(random()*1000000000000000)::bigint::text, 15, '0') WHERE user_code IS NULL AND role != 'admin'`,
    `ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT`,
    `ALTER TABLE messages ADD COLUMN IF NOT EXISTS seen_reply BOOLEAN NOT NULL DEFAULT FALSE`,
  ];
  for (const m of migrations) await pool.query(m).catch(()=>{});
  // Default settings
  await pool.query("INSERT INTO settings (key,value) VALUES ('maintenance','false') ON CONFLICT (key) DO NOTHING").catch(()=>{});

  const { rows } = await pool.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
  if (rows.length === 0) {
    const hash = await bcrypt.hash("admin123", 10);
    await pool.query("INSERT INTO users (username,email,password,role) VALUES ($1,$2,$3,'admin')", ["admin","admin@monster.com",hash]);
    console.log("✅ Admin créé — admin@monster.com / admin123");
  }
  console.log("✅ DB prête");
};
module.exports = { query, init };
