import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { badRequest, notFound, ok, route, unauthorized } from '@/lib/api';
import { hashToken, requireUser } from '@/lib/session';
import { splitCents } from '@/features/studio/calculations';
export const GET = route('households.GET', async (request: Request) => {
  const userId = await requireUser(request);
  return ok(await prisma.household.findMany({ where: { members: { some: { userId } } }, select: {
    id: true, name: true,
    members: { select: { userId: true, role: true, user: { select: { name: true, email: true } } } },
    expenses: { orderBy: { dueDate: 'desc' }, include: { shares: true }, take: 200 },
  } }));
});
export const POST = route('households.POST', async (request: Request) => {
  const userId = await requireUser(request), body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (body.action === 'create') {
    if (!name || name.length > 80) throw badRequest('Choose a household name under 80 characters');
    if (await prisma.householdMember.count({ where: { userId } }) >= 10) throw badRequest('You can join up to ten households');
    const household = await prisma.household.create({ data: { name, members: { create: { userId, role: 'owner' } } } });
    return ok({ id: household.id }, 201);
  }
  if (body.action === 'join') {
    if (typeof body.code !== 'string' || body.code.length > 100) throw badRequest('Enter an invitation code');
    const household = await prisma.household.findUnique({ where: { inviteHash: hashToken(body.code.trim()) } });
    if (!household?.inviteExpiresAt || household.inviteExpiresAt < new Date()) throw badRequest('This invitation is invalid or expired');
    await prisma.householdMember.upsert({ where: { householdId_userId: { householdId: household.id, userId } }, create: { householdId: household.id, userId }, update: {} });
    return ok({ id: household.id });
  }
  if (typeof body.householdId !== 'string') throw badRequest('Choose a household');
  const member = await prisma.householdMember.findUnique({ where: { householdId_userId: { householdId: body.householdId, userId } } });
  if (!member) throw unauthorized('You are not a member of this household');
  if (body.action === 'invite') {
    if (member.role !== 'owner') throw unauthorized('Only the household owner can create invitations');
    const code = randomBytes(18).toString('base64url');
    await prisma.household.update({ where: { id: body.householdId }, data: { inviteHash: hashToken(code), inviteExpiresAt: new Date(Date.now() + 7 * 86400000) } });
    return ok({ inviteCode: code });
  }
  if (body.action === 'expense') {
    if (!name || name.length > 120 || !Number.isFinite(body.amount) || body.amount <= 0 || body.amount > 999999999 || !Number.isFinite(Date.parse(body.dueDate))) throw badRequest('Enter a name, positive amount, and due date');
    const members = await prisma.householdMember.findMany({ where: { householdId: body.householdId }, orderBy: { userId: 'asc' } });
    if (!members.some(item => item.userId === body.payerId)) throw badRequest('The payer must be a household member');
    const shares = splitCents(body.amount, members.map(item => item.userId));
    await prisma.householdExpense.create({ data: { householdId: body.householdId, name, amount: body.amount, dueDate: new Date(body.dueDate), payerId: body.payerId, shares: { create: shares.map(share => ({ ...share, settled: share.userId === body.payerId })) } } });
    return ok({ success: true }, 201);
  }
  if (typeof body.expenseId !== 'string') throw badRequest('Choose an expense');
  const expense = await prisma.householdExpense.findFirst({ where: { id: body.expenseId, householdId: body.householdId } });
  if (!expense) throw notFound('Expense not found');
  if (body.action === 'paid') {
    if (expense.payerId !== userId) throw unauthorized('Only the assigned payer can record payment');
    await prisma.householdExpense.update({ where: { id: expense.id }, data: { paid: true } });
  } else if (body.action === 'settle') {
    if (!expense.paid || expense.payerId !== userId) throw unauthorized('The payer must confirm receipt of reimbursement after paying the bill');
    if (typeof body.memberId !== 'string') throw badRequest('Choose a member');
    await prisma.householdShare.update({ where: { expenseId_userId: { expenseId: expense.id, userId: body.memberId } }, data: { settled: true } });
  } else throw badRequest('Unknown household action');
  return ok({ success: true });
});
