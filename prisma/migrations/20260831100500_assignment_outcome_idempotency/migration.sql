-- Keep one learning outcome for an identical assignment event before adding the guard.
DELETE FROM "LeadAssignmentOutcome" newer
USING "LeadAssignmentOutcome" older
WHERE newer.id > older.id
  AND newer."applicantId" = older."applicantId"
  AND newer."agentId" = older."agentId"
  AND newer."assignedAt" = older."assignedAt";

CREATE UNIQUE INDEX "LeadAssignmentOutcome_applicantId_agentId_assignedAt_key"
ON "LeadAssignmentOutcome"("applicantId","agentId","assignedAt");
