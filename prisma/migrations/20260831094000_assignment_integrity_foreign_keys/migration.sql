-- Clean orphaned analytical rows before enforcing referential integrity.
DELETE FROM "LeadAssignmentExperimentUnit" u
WHERE NOT EXISTS (SELECT 1 FROM "LeadAssignmentExperiment" e WHERE e.id=u."experimentId")
   OR NOT EXISTS (SELECT 1 FROM "Applicant" a WHERE a.id=u."applicantId");

UPDATE "LeadAssignmentExperimentUnit" u SET "assignedAgentId"=NULL
WHERE "assignedAgentId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "User" x WHERE x.id=u."assignedAgentId");

DELETE FROM "LeadAssignmentOutcome" o
WHERE NOT EXISTS (SELECT 1 FROM "Applicant" a WHERE a.id=o."applicantId")
   OR NOT EXISTS (SELECT 1 FROM "User" x WHERE x.id=o."agentId")
   OR NOT EXISTS (SELECT 1 FROM "User" x WHERE x.id=o."assignedById");

ALTER TABLE "LeadAssignmentExperimentUnit"
  ADD CONSTRAINT "LeadAssignmentExperimentUnit_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "LeadAssignmentExperiment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LeadAssignmentExperimentUnit_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LeadAssignmentExperimentUnit_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeadAssignmentOutcome"
  ADD CONSTRAINT "LeadAssignmentOutcome_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LeadAssignmentOutcome_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LeadAssignmentOutcome_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "LeadAssignmentExperimentUnit_assignedAgentId_idx" ON "LeadAssignmentExperimentUnit"("assignedAgentId");
CREATE INDEX "LeadAssignmentOutcome_assignedById_idx" ON "LeadAssignmentOutcome"("assignedById");
