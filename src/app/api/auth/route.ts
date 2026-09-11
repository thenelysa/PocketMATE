import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/db';
import { ok, route, notFound, requireParam, requireField } from '@/lib/api';

/**
 * Mirrors the signed-in Google account into the `users` table.
 *
 * ⚠️ The caller's Google ID token is NOT verified here — see the auth section of
 * docs/ARCHITECTURE.md. Until it is, this endpoint trusts whatever it is sent.
 */
export const POST = route('auth.POST', async (request: Request) => {
  const body = await request.json();
  const email = requireField<string>(body, 'email');
  const profile = { name: body.name ?? null, picture: body.picture ?? null };

  const user = await prisma.user.upsert({
    where: { email },
    update: profile,
    create: { id: body.sub ?? randomUUID(), email, ...profile },
  });
  return ok(user);
});

export const GET = route('auth.GET', async (request: Request) => {
  const userId = requireParam(request, 'userId');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('User not found');
  return ok(user);
});
