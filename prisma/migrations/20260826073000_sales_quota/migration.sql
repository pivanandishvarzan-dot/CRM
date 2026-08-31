CREATE TABLE "SalesQuota" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "monthKey" TEXT NOT NULL,
  "targetValue" DECIMAL(18,2) NOT NULL,
  "targetCommission" DECIMAL(18,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalesQuota_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SalesQuota_userId_monthKey_key" ON "SalesQuota"("userId","monthKey");
CREATE INDEX "SalesQuota_agencyId_monthKey_idx" ON "SalesQuota"("agencyId","monthKey");
ALTER TABLE "SalesQuota" ADD CONSTRAINT "SalesQuota_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesQuota" ADD CONSTRAINT "SalesQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
