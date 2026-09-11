import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Next.js hot-reloads modules in dev, which would otherwise open a new client
// (and connection pool) on every file save until the database refuses more.
// Stashing it on globalThis makes reloads reuse the same one.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.'
    );
  }
  return new PrismaClient({
    // node-postgres adapter: works with Neon over TCP and with a local Postgres.
    adapter: new PrismaPg({
      connectionString,
      // Neon requires TLS; a plain local Postgres does not offer it.
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    }),
  });
}

/**
 * The Prisma client. Import this in route handlers; never construct your own.
 *
 * Built lazily on first property access, not at import: `next build` imports
 * every route module while collecting page data, and a build machine has no
 * DATABASE_URL.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    globalForPrisma.prisma ??= createClient();
    return Reflect.get(globalForPrisma.prisma, prop, receiver);
  },
});
