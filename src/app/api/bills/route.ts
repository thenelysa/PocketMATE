import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';
import { ok, route, requireParam, requireField, optionalDate, badRequest, conflict } from '@/lib/api';

function validateBill(body: Record<string, unknown>) {
  for (const key of ['amount', 'paidAmount']) if (body[key] !== undefined && (typeof body[key] !== 'number' || !Number.isFinite(body[key]) || Number(body[key]) < 0 || Number(body[key]) > 99999999)) throw badRequest('Enter a valid amount');
  if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 255)) throw badRequest('Enter a bill name');
  if (body.dueDate !== undefined && (typeof body.dueDate !== 'string' || !Number.isFinite(Date.parse(body.dueDate)))) throw badRequest('Choose a valid due date');
  if (body.status !== undefined && !['PAID','UNPAID'].includes(String(body.status))) throw badRequest('Choose a valid bill status');
}

export const GET = route('bills.GET', async (request: Request) => {
  const userId = await requireUser(request);
  const bills = await prisma.bill.findMany({
    where: { userId },
    orderBy: { dueDate: 'asc' },
  });
  return ok(bills);
});

export const POST = route('bills.POST', async (request: Request) => {
  const userId = await requireUser(request);
  const body = await request.json();
  validateBill(body);
  const bill = await prisma.bill.create({
    data: {
      userId,
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
  const userId = await requireUser(request);
  const body = await request.json();
  validateBill(body);
  const id = requireField<string>(body, 'id');

  // Prisma leaves a column untouched when its value is `undefined`, so omitting
  // a field from the request body is a genuine partial update — no COALESCE.
  // A field sent as `null` still clears the column.
  const bill = await prisma.$transaction(async tx => {
    const previous = await tx.bill.findUniqueOrThrow({ where: { id, userId } });
    const recordingPayment = body.status === 'PAID' && previous.status !== 'PAID';
    const data = {
      name: body.name,
      provider: body.provider,
      amount: body.amount,
      dueDate: optionalDate(body.dueDate) ?? undefined,
      category: body.category,
      recurrence: body.recurrence,
      notes: body.notes,
      isBusiness: body.isBusiness,
      status: body.status,
      paidAmount: recordingPayment ? body.amount ?? previous.amount : body.paidAmount,
      paymentDate: recordingPayment ? new Date() : optionalDate(body.paymentDate),
    };
    const updated = await tx.bill.updateMany({ where: { id, userId, updatedAt: previous.updatedAt, status: previous.status }, data });
    if (!updated.count) throw conflict('This bill changed. Refresh and try again.');
    if (recordingPayment) {
      const amount = Math.max(0, Number(body.amount ?? previous.amount) - Number(previous.paidAmount ?? 0));
      await tx.studioPlan.updateMany({ where: { userId }, data: { balance: { decrement: amount }, version: { increment: 1 } } });
      await tx.billPayment.create({ data: { id: crypto.randomUUID(), billId: id, amount, paymentDate: new Date() } });
    }
    return tx.bill.findUniqueOrThrow({ where: { id, userId } });
  });
  return ok(bill);
});

export const DELETE = route('bills.DELETE', async (request: Request) => {
  const userId = await requireUser(request);
  const id = requireParam(request, 'id');
  const deleted = await prisma.bill.delete({ where: { id, userId }, select: { id: true } });
  return ok(deleted);
});
