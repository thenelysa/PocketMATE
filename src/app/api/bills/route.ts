import { prisma } from '@/lib/db';
import { ok, route, requireParam, requireField, optionalDate } from '@/lib/api';

export const GET = route('bills.GET', async (request: Request) => {
  const userId = requireParam(request, 'userId');
  const bills = await prisma.bill.findMany({
    where: { userId },
    orderBy: { dueDate: 'asc' },
  });
  return ok(bills);
});

export const POST = route('bills.POST', async (request: Request) => {
  const body = await request.json();
  const bill = await prisma.bill.create({
    data: {
      userId: requireField<string>(body, 'userId'),
      name: requireField<string>(body, 'name'),
      amount: requireField<number>(body, 'amount'),
      dueDate: new Date(requireField<string>(body, 'dueDate')),
      provider: body.provider ?? null,
      category: body.category ?? null,
      recurrence: body.recurrence ?? null,
      notes: body.notes ?? null,
      isBusiness: body.isBusiness ?? false,
      status: body.status ?? 'UNPAID',
      paidAmount: body.paidAmount ?? 0,
      paymentDate: optionalDate(body.paymentDate) ?? null,
    },
  });
  return ok(bill, 201);
});

export const PUT = route('bills.PUT', async (request: Request) => {
  const body = await request.json();
  const id = requireField<string>(body, 'id');

  // Prisma leaves a column untouched when its value is `undefined`, so omitting
  // a field from the request body is a genuine partial update — no COALESCE.
  // A field sent as `null` still clears the column.
  const bill = await prisma.bill.update({
    where: { id },
    data: {
      name: body.name,
      provider: body.provider,
      amount: body.amount,
      dueDate: optionalDate(body.dueDate) ?? undefined,
      category: body.category,
      recurrence: body.recurrence,
      notes: body.notes,
      isBusiness: body.isBusiness,
      status: body.status,
      paidAmount: body.paidAmount,
      paymentDate: optionalDate(body.paymentDate),
    },
  });
  return ok(bill);
});

export const DELETE = route('bills.DELETE', async (request: Request) => {
  const id = requireParam(request, 'id');
  const deleted = await prisma.bill.delete({ where: { id }, select: { id: true } });
  return ok(deleted);
});
