CREATE TABLE "TeamChallenge" ("id" TEXT NOT NULL,"agencyId" TEXT NOT NULL,"createdById" TEXT NOT NULL,"title" TEXT NOT NULL,"description" TEXT,"metric" TEXT NOT NULL,"target" INTEGER NOT NULL,"rewardTitle" TEXT,"startAt" TIMESTAMP(3) NOT NULL,"endAt" TIMESTAMP(3) NOT NULL,"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "TeamChallenge_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ChallengeReward" ("id" TEXT NOT NULL,"challengeId" TEXT NOT NULL,"userId" TEXT NOT NULL,"value" INTEGER NOT NULL,"completed" BOOLEAN NOT NULL DEFAULT false,"completedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "ChallengeReward_pkey" PRIMARY KEY ("id"));
CREATE INDEX "TeamChallenge_agencyId_active_startAt_endAt_idx" ON "TeamChallenge"("agencyId","active","startAt","endAt");
CREATE UNIQUE INDEX "ChallengeReward_challengeId_userId_key" ON "ChallengeReward"("challengeId","userId");
CREATE INDEX "ChallengeReward_userId_completed_idx" ON "ChallengeReward"("userId","completed");
ALTER TABLE "TeamChallenge" ADD CONSTRAINT "TeamChallenge_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamChallenge" ADD CONSTRAINT "TeamChallenge_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChallengeReward" ADD CONSTRAINT "ChallengeReward_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "TeamChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeReward" ADD CONSTRAINT "ChallengeReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
