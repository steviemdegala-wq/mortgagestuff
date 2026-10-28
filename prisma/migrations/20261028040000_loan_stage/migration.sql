-- Preserve existing pipeline stages before making each loan independent.
ALTER TABLE "Loan" ADD COLUMN "stage" TEXT;
UPDATE "Loan" AS loan SET "stage" = COALESCE(person."stage", 'New Lead')
FROM "Person" AS person WHERE loan."personId" = person."id";
ALTER TABLE "Loan" ALTER COLUMN "stage" SET DEFAULT 'New Lead';
