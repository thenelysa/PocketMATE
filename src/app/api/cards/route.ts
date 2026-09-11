import { prisma } from '@/lib/db';
import { ok, route, requireParam, requireField } from '@/lib/api';

export const GET = route('cards.GET', async (request: Request) => {
  const userId = requireParam(request, 'userId');
  const cards = await prisma.creditCard.findMany({
    where: { userId },
    orderBy: { bankName: 'asc' },
  });
  return ok(cards);
});

export const POST = route('cards.POST', async (request: Request) => {
  const body = await request.json();
  const card = await prisma.creditCard.create({
    data: {
      userId: requireField<string>(body, 'userId'),
      bankName: requireField<string>(body, 'bankName'),
      creditLimit: requireField<number>(body, 'creditLimit'),
      cardName: body.cardName ?? null,
      lastFourDigits: body.lastFourDigits ?? null,
      currentOutstanding: body.currentOutstanding ?? 0,
      statementDate: body.statementDate ?? 1,
      paymentDueDate: body.paymentDueDate ?? 15,
      minimumPayment: body.minimumPayment ?? 0,
      annualInterestRate: body.annualInterestRate ?? 0,
      cardStatus: body.cardStatus ?? 'ACTIVE',
    },
  });
  return ok(card, 201);
});

export const DELETE = route('cards.DELETE', async (request: Request) => {
  const id = requireParam(request, 'id');
  const deleted = await prisma.creditCard.delete({ where: { id }, select: { id: true } });
  return ok(deleted);
});
