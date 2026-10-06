-- CreateTable
CREATE TABLE "sessions" (
    "token_hash" TEXT NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("token_hash")
);

-- CreateTable
CREATE TABLE "studio_plans" (
    "user_id" VARCHAR(255) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "income" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "next_payday" TIMESTAMP(3),
    "cadence" INTEGER NOT NULL DEFAULT 30,
    "reserve" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "daily_spending" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "transactions" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "studio_plans_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "invite_hash" TEXT,
    "invite_expires_at" TIMESTAMP(3),

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_members" (
    "household_id" TEXT NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("household_id","user_id")
);

-- CreateTable
CREATE TABLE "household_expenses" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "payer_id" VARCHAR(255) NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "household_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_shares" (
    "expense_id" TEXT NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "settled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "household_shares_pkey" PRIMARY KEY ("expense_id","user_id")
);

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "households_invite_hash_key" ON "households"("invite_hash");

-- CreateIndex
CREATE INDEX "household_expenses_household_id_idx" ON "household_expenses"("household_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_plans" ADD CONSTRAINT "studio_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_expenses" ADD CONSTRAINT "household_expenses_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_shares" ADD CONSTRAINT "household_shares_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "household_expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
