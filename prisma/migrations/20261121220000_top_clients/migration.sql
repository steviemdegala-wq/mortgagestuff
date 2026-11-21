BEGIN;

CREATE TABLE "TopClient" (
    "rank" INTEGER NOT NULL CONSTRAINT "TopClient_rank_range" CHECK ("rank" BETWEEN 1 AND 10),
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "expectedDeals" INTEGER,
    "averageDealSize" DOUBLE PRECISION,
    "commissionRate" DOUBLE PRECISION,
    "annualValueOverride" DOUBLE PRECISION,
    CONSTRAINT "TopClient_pkey" PRIMARY KEY ("rank")
);

CREATE TABLE "_PersonToTopClient" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_PersonToTopClient_AB_pkey" PRIMARY KEY ("A", "B")
);

CREATE INDEX "_PersonToTopClient_B_index" ON "_PersonToTopClient"("B");

ALTER TABLE "_PersonToTopClient" ADD CONSTRAINT "_PersonToTopClient_A_fkey"
    FOREIGN KEY ("A") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PersonToTopClient" ADD CONSTRAINT "_PersonToTopClient_B_fkey"
    FOREIGN KEY ("B") REFERENCES "TopClient"("rank") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
