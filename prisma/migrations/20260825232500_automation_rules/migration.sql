CREATE TABLE "AutomationRule" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "thresholdDays" INTEGER NOT NULL DEFAULT 0,
  "action" TEXT NOT NULL DEFAULT 'ALERT',
  "priority" INTEGER NOT NULL DEFAULT 2,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AutomationRule_agencyId_key_key" ON "AutomationRule"("agencyId", "key");
CREATE INDEX "AutomationRule_agencyId_enabled_idx" ON "AutomationRule"("agencyId", "enabled");
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
