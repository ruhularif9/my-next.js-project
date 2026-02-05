import 'dotenv/config';

import postgres from 'postgres';

import bcrypt from 'bcrypt';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

async function seedUser() {
  try {
    // Ensure users table exists
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `;

    const hashedPassword = await bcrypt.hash('123456', 10);

    await sql`
      INSERT INTO users (name, email, password)
      VALUES ('Admin User', 'admin@example.com', ${hashedPassword})
      ON CONFLICT (email) DO NOTHING;
    `;

    console.log('✅ Test user created');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    process.exit();
  }
}

seedUser();
