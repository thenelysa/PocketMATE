import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { badRequest, conflict, ok, route } from '@/lib/api';
import { requireUser } from '@/lib/session';
export const GET = route('studio.GET', async (request: Request) => {
  const userId = await requireUser(request);
  return ok(await prisma.studioPlan.upsert({ where: { userId }, create: { userId }, update: {} }));
});
export const PUT = route('studio.PUT', async (request: Request) => {
  const userId = await requireUser(request), body = await request.json();
  if (!Number.isInteger(body.version)) throw badRequest('Reload your plan before saving');
  const data: Prisma.StudioPlanUpdateManyMutationInput = { version: { increment: 1 } };
  if (body.transactions !== undefined) {
    if (!Array.isArray(body.transactions) || body.transactions.length > 5000) throw badRequest('Import up to 5,000 transactions');
    const ids = new Set<string>();
    for (const row of body.transactions) {
      if (!row || typeof row.id !== 'string' || row.id.length > 1500 || ids.has(row.id) || typeof row.merchant !== 'string' || !row.merchant.trim() || row.merchant.length > 200 || !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !Number.isFinite(Date.parse(row.date)) || !Number.isFinite(row.amount) || Math.abs(row.amount) > 999999999) throw badRequest('Invalid statement row');
      ids.add(row.id);
    }
    data.transactions = body.transactions;
  } else {
    for (const key of ['balance', 'income', 'reserve', 'dailySpending'] as const) {
      if (!Number.isFinite(body[key]) || body[key] < (key === 'balance' ? -999999999 : 0) || body[key] > 999999999) throw badRequest(`Enter a valid ${key}`);
      data[key] = Math.round(body[key] * 100) / 100;
    }
    if (![7,14,30].includes(body.cadence)) throw badRequest('Choose a pay frequency');
    if (body.nextPayday && !Number.isFinite(Date.parse(body.nextPayday))) throw badRequest('Choose a valid payday');
    data.cadence = body.cadence; data.nextPayday = body.nextPayday ? new Date(body.nextPayday) : null; data.balanceDate = new Date();
  }
  const updated = await prisma.studioPlan.updateMany({ where: { userId, version: body.version }, data });
  if (!updated.count) throw conflict('Your plan changed in another tab. Reload and try again.');
  return ok(await prisma.studioPlan.findUniqueOrThrow({ where: { userId } }));
});
