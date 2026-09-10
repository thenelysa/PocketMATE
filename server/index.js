const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Helper to generate ID
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

// ============= USER ROUTES =============

app.post('/api/users', async (req, res) => {
  try {
    const { id, email, name, picture } = req.body;
    const result = await pool.query(
      `INSERT INTO users (id, email, name, picture) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET name = $3, picture = $4, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, email, name, picture]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= PROFILE ROUTES =============

app.get('/api/profiles/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [req.params.userId]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profiles', async (req, res) => {
  try {
    const { userId, displayName, preferredCurrency, reminderDaysBefore, monthlyBudget } = req.body;
    const id = generateId();
    const result = await pool.query(
      `INSERT INTO user_profiles (id, user_id, display_name, preferred_currency, reminder_days_before, monthly_budget)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         display_name = $3, preferred_currency = $4, reminder_days_before = $5, monthly_budget = $6, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, userId, displayName, preferredCurrency || 'NPR', reminderDaysBefore || 3, monthlyBudget]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= BILLS ROUTES =============

app.get('/api/bills/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bills WHERE user_id = $1 ORDER BY due_date', [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bills', async (req, res) => {
  try {
    const { id, userId, name, provider, amount, dueDate, category, recurrence, notes, isBusiness } = req.body;
    const billId = id || generateId();
    const result = await pool.query(
      `INSERT INTO bills (id, user_id, name, provider, amount, due_date, category, recurrence, notes, is_business, status, paid_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'UNPAID', 0)
       RETURNING *`,
      [billId, userId, name, provider, amount, dueDate, category, recurrence, notes, isBusiness]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bills/:id', async (req, res) => {
  try {
    const { name, provider, amount, dueDate, category, recurrence, status, isBusiness, paidAmount, paymentDate, notes } = req.body;
    const result = await pool.query(
      `UPDATE bills SET name = $1, provider = $2, amount = $3, due_date = $4, category = $5,
       recurrence = $6, status = $7, is_business = $8, paid_amount = $9, payment_date = $10, notes = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [name, provider, amount, dueDate, category, recurrence, status, isBusiness, paidAmount, paymentDate, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bills/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM bills WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= BILL PAYMENTS ROUTES =============

app.post('/api/bill-payments', async (req, res) => {
  try {
    const { id, billId, amount, paymentDate } = req.body;
    const paymentId = id || generateId();
    const result = await pool.query(
      `INSERT INTO bill_payments (id, bill_id, amount, payment_date) VALUES ($1, $2, $3, $4) RETURNING *`,
      [paymentId, billId, amount, paymentDate]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bill-payments/:billId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bill_payments WHERE bill_id = $1 ORDER BY payment_date DESC', [req.params.billId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= CREDIT CARDS ROUTES =============

app.get('/api/cards/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM credit_cards WHERE user_id = $1', [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cards', async (req, res) => {
  try {
    const { userId, bankName, cardName, lastFourDigits, creditLimit, statementDate, paymentDueDate, minimumPayment, annualInterestRate } = req.body;
    const id = generateId();
    const result = await pool.query(
      `INSERT INTO credit_cards (id, user_id, bank_name, card_name, last_four_digits, credit_limit, statement_date, payment_due_date, minimum_payment, annual_interest_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [id, userId, bankName, cardName, lastFourDigits, creditLimit, statementDate, paymentDueDate, minimumPayment, annualInterestRate]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cards/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM credit_cards WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= CARD TRANSACTIONS ROUTES =============

app.post('/api/card-transactions', async (req, res) => {
  try {
    const { id, cardId, description, amount, transactionDate } = req.body;
    const txId = id || generateId();
    const result = await pool.query(
      `INSERT INTO card_transactions (id, card_id, description, amount, transaction_date) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [txId, cardId, description, amount, transactionDate]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= CARD PAYMENTS ROUTES =============

app.post('/api/card-payments', async (req, res) => {
  try {
    const { id, cardId, amount, paymentDate, notes } = req.body;
    const paymentId = id || generateId();
    const result = await pool.query(
      `INSERT INTO card_payments (id, card_id, amount, payment_date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [paymentId, cardId, amount, paymentDate, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= REMINDERS ROUTES =============

app.get('/api/reminders/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reminders WHERE user_id = $1 ORDER BY remind_at', [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reminders', async (req, res) => {
  try {
    const { id, userId, type, referenceId, referenceType, title, message, remindAt } = req.body;
    const reminderId = id || generateId();
    const result = await pool.query(
      `INSERT INTO reminders (id, user_id, type, reference_id, reference_type, title, message, remind_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [reminderId, userId, type, referenceId, referenceType, title, message, remindAt]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reminders/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM reminders WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
