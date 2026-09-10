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
      'SELECT * FROM bills WHERE user_id = $1 ORDER BY due_date',
      [userId]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, provider, amount, dueDate, category, recurrence, notes, isBusiness } = body;

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const result = await pool.query(
      `INSERT INTO bills (id, user_id, name, provider, amount, due_date, category, recurrence, notes, is_business, status, paid_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'UNPAID', 0) RETURNING *`,
      [id, userId, name, provider, amount, dueDate, category, recurrence, notes, isBusiness]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}
