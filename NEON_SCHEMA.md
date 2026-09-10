# Neon Database Connection

This project is connected to a Neon PostgreSQL database.

## Connection Details

- **Host**: ep-misty-haze-ax3o5jsn-pooler.us-east-2.aws.neon.tech
- **Database**: neondb
- **Branch**: production

## Environment Variables

```
DATABASE_URL=postgresql://neondb_owner:***@ep-misty-haze-ax3o5jsn-pooler.c-4.us-east-2.aws.neon.tech/neondb
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:***@ep-misty-haze-ax3o5jsn.c-4.us-east-2.aws.neon.tech/neondb
NEON_BRANCH=production
VITE_DATABASE_URL=postgresql://neondb_owner:***@ep-misty-haze-ax3o5jsn-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Important**: Never commit the actual password. Use environment variables only.

## Usage

Import the database utilities:

```ts
import { query, queryOne, pool } from '@/lib/db';

// Example queries
const users = await query('SELECT * FROM users WHERE email = $1', [email]);
const user = await queryOne('SELECT * FROM users WHERE id = $1', [userId]);
await pool.end(); // Close pool when done
```

## Schema Tables

Create these tables in your Neon database:

```sql
-- Users table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  picture TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bills table
CREATE TABLE bills (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  due_date TIMESTAMP NOT NULL,
  category VARCHAR(50),
  recurrence VARCHAR(20),
  status VARCHAR(20) DEFAULT 'UNPAID',
  is_business BOOLEAN DEFAULT FALSE,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  payment_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill payments table
CREATE TABLE bill_payments (
  id VARCHAR(255) PRIMARY KEY,
  bill_id VARCHAR(255) REFERENCES bills(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credit cards table
CREATE TABLE credit_cards (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  bank_name VARCHAR(255) NOT NULL,
  card_name VARCHAR(255),
  last_four_digits VARCHAR(4),
  credit_limit DECIMAL(10, 2) NOT NULL,
  current_outstanding DECIMAL(10, 2) DEFAULT 0,
  statement_date INTEGER DEFAULT 1,
  payment_due_date INTEGER DEFAULT 15,
  minimum_payment DECIMAL(10, 2) DEFAULT 0,
  annual_interest_rate DECIMAL(5, 2) DEFAULT 0,
  card_status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Card transactions table
CREATE TABLE card_transactions (
  id VARCHAR(255) PRIMARY KEY,
  card_id VARCHAR(255) REFERENCES credit_cards(id),
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Card payments table
CREATE TABLE card_payments (
  id VARCHAR(255) PRIMARY KEY,
  card_id VARCHAR(255) REFERENCES credit_cards(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reminders table
CREATE TABLE reminders (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  reference_id VARCHAR(255),
  reference_type VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  remind_at TIMESTAMP NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table
CREATE TABLE user_profiles (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  display_name VARCHAR(255),
  preferred_currency VARCHAR(10) DEFAULT 'NPR',
  reminder_days_before INTEGER DEFAULT 3,
  monthly_budget DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
