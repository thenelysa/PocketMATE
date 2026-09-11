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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, provider, amount, dueDate, category, recurrence, notes, isBusiness, status, paidAmount, paymentDate } = body;

    const result = await pool.query(
      `UPDATE bills SET
        name = COALESCE($1, name),
        provider = COALESCE($2, provider),
        amount = COALESCE($3, amount),
        due_date = COALESCE($4, due_date),
        category = COALESCE($5, category),
        recurrence = COALESCE($6, recurrence),
        notes = COALESCE($7, notes),
        is_business = COALESCE($8, is_business),
        status = COALESCE($9, status),
        paid_amount = COALESCE($10, paid_amount),
        payment_date = COALESCE($11, payment_date),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [name, provider, amount, dueDate, category, recurrence, notes, isBusiness, status, paidAmount, paymentDate, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Bill ID required' }, { status: 400 });
    }

    await pool.query('DELETE FROM bills WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
  }
}
