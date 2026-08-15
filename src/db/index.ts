import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

// Load .env.local and .env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  console.warn(
    '⚠️ DATABASE_URL não encontrada. Certifique-se de preencher a variável DATABASE_URL no arquivo .env.local'
  );
}

// Connection client for PostgreSQL / Supabase Pooler (Serverless friendly)
export const client = postgres(connectionString, {
  prepare: false,
  max: 1,
  ssl: 'require',
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
