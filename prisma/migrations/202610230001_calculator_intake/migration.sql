ALTER TABLE "Loan" ADD COLUMN "calculatorKey" TEXT,
ADD COLUMN "calculatorStage" TEXT,
ADD COLUMN "calculatorContactKey" TEXT,
ADD COLUMN "calculatorPropertyKey" TEXT,
ADD COLUMN "estimateBorrowerSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "estimateInternalSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "projectLetterSent" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "Loan_calculatorKey_key" ON "Loan"("calculatorKey");
