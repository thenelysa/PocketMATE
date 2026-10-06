-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "picture" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(255),
    "amount" DECIMAL(10,2) NOT NULL,
    "due_date" TIMESTAMP(6) NOT NULL,
    "category" VARCHAR(50),
    "recurrence" VARCHAR(20),
    "status" VARCHAR(20) DEFAULT 'UNPAID',
    "is_business" BOOLEAN DEFAULT false,
    "paid_amount" DECIMAL(10,2) DEFAULT 0,
    "payment_date" TIMESTAMP(6),
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_cards" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255),
    "bank_name" VARCHAR(255) NOT NULL,
    "card_name" VARCHAR(255),
    "last_four_digits" VARCHAR(4),
    "credit_limit" DECIMAL(10,2) NOT NULL,
    "current_outstanding" DECIMAL(10,2) DEFAULT 0,
    "statement_date" INTEGER DEFAULT 1,
    "payment_due_date" INTEGER DEFAULT 15,
    "minimum_payment" DECIMAL(10,2) DEFAULT 0,
    "annual_interest_rate" DECIMAL(5,2) DEFAULT 0,
    "card_status" VARCHAR(20) DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255),
    "type" VARCHAR(50) NOT NULL,
    "reference_id" VARCHAR(255),
    "reference_type" VARCHAR(50),
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT,
    "remind_at" TIMESTAMP(6) NOT NULL,
    "is_sent" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_payments" (
    "id" VARCHAR(255) NOT NULL,
    "bill_id" VARCHAR(255),
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_date" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_payments" (
    "id" VARCHAR(255) NOT NULL,
    "card_id" VARCHAR(255),
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_date" TIMESTAMP(6) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_transactions" (
    "id" VARCHAR(255) NOT NULL,
    "card_id" VARCHAR(255),
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "transaction_date" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255),
    "display_name" VARCHAR(255),
    "preferred_currency" VARCHAR(10) DEFAULT 'NPR',
    "reminder_days_before" INTEGER DEFAULT 3,
    "monthly_budget" DECIMAL(10,2),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "card_payments" ADD CONSTRAINT "card_payments_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "credit_cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "card_transactions" ADD CONSTRAINT "card_transactions_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "credit_cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
