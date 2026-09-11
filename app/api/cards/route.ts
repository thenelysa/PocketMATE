import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM credit_cards WHERE user_id = $1',
      [userId]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, bankName, cardName, lastFourDigits, creditLimit, statementDate, paymentDueDate, minimumPayment, annualInterestRate } = body;

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const result = await pool.query(
      `INSERT INTO credit_cards (id, user_id, bank_name, card_name, last_four_digits, credit_limit, statement_date, payment_due_date, minimum_payment, annual_interest_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [id, userId, bankName, cardName, lastFourDigits, creditLimit, statementDate, paymentDueDate, minimumPayment, annualInterestRate]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Card ID required' }, { status: 400 });
    }

    await pool.query('DELETE FROM credit_cards WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 });
  }
}
