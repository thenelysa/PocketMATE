import { defineConfig } from 'prisma/config';

// A real environment variable always wins — CI and production set DATABASE_URL
// directly, and `DATABASE_URL=... npx prisma ...` must work for one-off targets.
// Otherwise fall back to the files, with .env.local overriding .env (as Next does).
const ambient = process.env.DATABASE_URL;

for (const file of ['.env', '.env.local']) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file absent — fine
  }
}

if (ambient) process.env.DATABASE_URL = ambient;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL },
});
