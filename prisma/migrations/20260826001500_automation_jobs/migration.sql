CREATE TABLE "AutomationJob" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "runAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "lockedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AutomationJob_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AutomationJob_key_key" ON "AutomationJob"("key");
CREATE INDEX "AutomationJob_status_runAt_idx" ON "AutomationJob"("status", "runAt");
CREATE INDEX "AutomationJob_agencyId_status_runAt_idx" ON "AutomationJob"("agencyId", "status", "runAt");
ALTER TABLE "AutomationJob" ADD CONSTRAINT "AutomationJob_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
