import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';
import { ok, route, requireParam, requireField, badRequest } from '@/lib/api';

export const GET = route('reminders.GET', async (request: Request) => {
  const userId = await requireUser(request);
  const reminders = await prisma.reminder.findMany({
    where: { userId },
    orderBy: { remindAt: 'asc' },
  });
  return ok(reminders);
});

export const POST = route('reminders.POST', async (request: Request) => {
  const userId = await requireUser(request);
  const body = await request.json();
  const remindAt = new Date(requireField<string>(body, 'remindAt'));
  if (!Number.isFinite(remindAt.getTime()) || remindAt.getTime() <= Date.now()) {
    throw badRequest('Choose a reminder date and time in the future');
  }
  const reminder = await prisma.reminder.create({
    data: {
      userId,
      // `type` and `title` are NOT NULL in the database.
      type: requireField<string>(body, 'type'),
      title: requireField<string>(body, 'title'),
      remindAt,
      referenceId: body.referenceId ?? null,
      referenceType: body.referenceType ?? null,
      message: body.message ?? null,
      isSent: false,
    },
  });
  return ok(reminder, 201);
});

export const DELETE = route('reminders.DELETE', async (request: Request) => {
  const userId = await requireUser(request);
  const id = requireParam(request, 'id');
  const deleted = await prisma.reminder.delete({ where: { id, userId }, select: { id: true } });
  return ok(deleted);
});

// Acknowledgement is scoped to the current user, like reminder reads.
export const PUT = route('reminders.PUT', async (request: Request) => {
  const userId = await requireUser(request);
  const body = await request.json();
  const reminder = await prisma.reminder.update({
    where: { id: requireField<string>(body, 'id'), userId },
    data: { isSent: true },
  });
  return ok(reminder);
});
