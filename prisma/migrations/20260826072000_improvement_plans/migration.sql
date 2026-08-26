CREATE TABLE "ImprovementPlan" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "weekKey" TEXT NOT NULL,
  "focusKey" TEXT NOT NULL,
  "focusLabel" TEXT NOT NULL,
  "baselineScore" INTEGER NOT NULL,
  "targetScore" INTEGER NOT NULL,
  "kpis" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ImprovementPlan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ImprovementPlan_userId_weekKey_key" ON "ImprovementPlan"("userId","weekKey");
CREATE INDEX "ImprovementPlan_agencyId_weekKey_idx" ON "ImprovementPlan"("agencyId","weekKey");
ALTER TABLE "ImprovementPlan" ADD CONSTRAINT "ImprovementPlan_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImprovementPlan" ADD CONSTRAINT "ImprovementPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
