import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from './db';
import { unauthorized } from './api';
const cookieName = 'pocketmate_session';
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw unauthorized('Request origin is not allowed');
  if (request.headers.get('sec-fetch-site') === 'cross-site') throw unauthorized();
}
export async function requireUser(request: Request) {
  if (!['GET', 'HEAD'].includes(request.method)) checkOrigin(request);
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) throw unauthorized('Please sign in again');
  const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!session || session.expiresAt.getTime() <= Date.now()) throw unauthorized('Your session has expired. Please sign in again');
  return session.userId;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  (await cookies()).set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: expiresAt });
}
export async function endSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(cookieName);
}
