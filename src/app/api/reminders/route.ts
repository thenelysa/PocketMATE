import { prisma } from '@/lib/db';
import { ok, route, requireParam, requireField } from '@/lib/api';

export const GET = route('reminders.GET', async (request: Request) => {
  const userId = requireParam(request, 'userId');
  const reminders = await prisma.reminder.findMany({
    where: { userId },
    orderBy: { remindAt: 'asc' },
  });
  return ok(reminders);
});

export const POST = route('reminders.POST', async (request: Request) => {
  const body = await request.json();
  const reminder = await prisma.reminder.create({
    data: {
      userId: requireField<string>(body, 'userId'),
      // `type` and `title` are NOT NULL in the database.
      type: requireField<string>(body, 'type'),
      title: requireField<string>(body, 'title'),
      remindAt: new Date(requireField<string>(body, 'remindAt')),
      referenceId: body.referenceId ?? null,
      referenceType: body.referenceType ?? null,
      message: body.message ?? null,
      isSent: body.isSent ?? false,
    },
  });
  return ok(reminder, 201);
});

export const DELETE = route('reminders.DELETE', async (request: Request) => {
  const id = requireParam(request, 'id');
  const deleted = await prisma.reminder.delete({ where: { id }, select: { id: true } });
  return ok(deleted);
});
