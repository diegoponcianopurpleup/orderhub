-- Add preparation status workflow for kitchen board
ALTER TABLE "Order" ADD COLUMN "prepStatus" TEXT NOT NULL DEFAULT 'NEW';

-- Improve filtering performance in kitchen views
CREATE INDEX "Order_companyId_prepStatus_idx" ON "Order"("companyId", "prepStatus");
