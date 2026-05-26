-- Add idempotency key to transactions
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_idempotencyKey_key" ON "Transaction"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Transaction_idempotencyKey_idx" ON "Transaction"("idempotencyKey");

-- Add refund fields to transactions
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3);
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "refundReason" TEXT;

-- Convert status to enum (if not already)
DO $$ BEGIN
    CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing status values to match enum
UPDATE "Transaction" SET "status" = 'COMPLETED' WHERE "status" = 'COMPLETED';
UPDATE "Transaction" SET "status" = 'PENDING' WHERE "status" = 'PENDING';
UPDATE "Transaction" SET "status" = 'CANCELLED' WHERE "status" = 'CANCELLED';

-- Alter column type to use enum (backup old column first)
ALTER TABLE "Transaction" RENAME COLUMN "status" TO "status_old";
ALTER TABLE "Transaction" ADD COLUMN "status" "TransactionStatus" DEFAULT 'COMPLETED';
UPDATE "Transaction" SET "status" = "status_old"::"TransactionStatus";
ALTER TABLE "Transaction" DROP COLUMN "status_old";

-- Add status index
CREATE INDEX IF NOT EXISTS "Transaction_status_idx" ON "Transaction"("status");

-- Add payment status and type fields
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'COMPLETED';
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'PAYMENT';
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");

-- Add lastPurchaseAt to customers
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "lastPurchaseAt" TIMESTAMP(3);

-- Add lastUpdated to inventory
ALTER TABLE "Inventory" ADD COLUMN IF NOT EXISTS "lastUpdated" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Inventory_productId_idx" ON "Inventory"("productId");
