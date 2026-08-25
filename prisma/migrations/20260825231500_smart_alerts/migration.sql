CREATE TABLE "Alert" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "severity" INTEGER NOT NULL DEFAULT 2,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "href" TEXT,
  "readAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Alert_key_key" ON "Alert"("key");
CREATE INDEX "Alert_userId_resolvedAt_createdAt_idx" ON "Alert"("userId", "resolvedAt", "createdAt");
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
