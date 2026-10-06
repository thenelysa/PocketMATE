import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/db';
import { ok, route, requireField, unauthorized } from '@/lib/api';
import { checkOrigin, createSession, endSession, requireUser } from '@/lib/session';

export const POST = route('auth.POST', async (request: Request) => {
  checkOrigin(request);
  const body = await request.json();
  const accessToken = requireField<string>(body, 'accessToken');
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (typeof accessToken !== 'string' || accessToken.length > 4096 || !clientId) throw unauthorized();
  const info = await new OAuth2Client().getTokenInfo(accessToken).catch(() => null);
  if (!info || info.aud !== clientId || info.expiry_date <= Date.now()) throw unauthorized('Google sign-in could not be verified');
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
  if (!response.ok) throw unauthorized();
  const profile = await response.json();
  if (!profile.sub || !profile.email || profile.email_verified !== true || (info.sub && info.sub !== profile.sub)) throw unauthorized();
  const user = await prisma.user.upsert({ where: { email: profile.email }, create: { id: profile.sub, email: profile.email, name: profile.name, picture: profile.picture }, update: { name: profile.name, picture: profile.picture } });
  await createSession(user.id);
  return ok({ sub: user.id, email: user.email, name: user.name ?? '', picture: user.picture ?? '' });
});
export const GET = route('auth.GET', async (request: Request) => {
  const id = await requireUser(request);
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });
  return ok({ sub: user.id, email: user.email, name: user.name ?? '', picture: user.picture ?? '' });
});
export const DELETE = route('auth.DELETE', async (request: Request) => {
  const id = await requireUser(request);
  await prisma.user.delete({ where: { id } });
  await endSession();
  return ok({ id });
});
