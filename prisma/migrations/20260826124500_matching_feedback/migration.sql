ALTER TABLE "Agency" ADD COLUMN "matchingConfig" JSONB;
CREATE TABLE "MatchFeedback" (
  "id" TEXT NOT NULL,
  "applicantId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "verdict" TEXT NOT NULL,
  "reason" TEXT,
  "score" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MatchFeedback_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MatchFeedback_applicantId_propertyId_userId_key" ON "MatchFeedback"("applicantId","propertyId","userId");
CREATE INDEX "MatchFeedback_propertyId_verdict_idx" ON "MatchFeedback"("propertyId","verdict");
CREATE INDEX "MatchFeedback_applicantId_verdict_idx" ON "MatchFeedback"("applicantId","verdict");
ALTER TABLE "MatchFeedback" ADD CONSTRAINT "MatchFeedback_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchFeedback" ADD CONSTRAINT "MatchFeedback_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchFeedback" ADD CONSTRAINT "MatchFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
