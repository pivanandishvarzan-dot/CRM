WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY "agencyId"
           ORDER BY "createdAt" DESC, id DESC
         ) AS rn
  FROM "LeadAssignmentExperiment"
  WHERE status = 'ACTIVE'
)
UPDATE "LeadAssignmentExperiment" e
SET status = 'ENDED',
    "endedAt" = COALESCE(e."endedAt", CURRENT_TIMESTAMP)
FROM ranked r
WHERE e.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX "LeadAssignmentExperiment_one_active_per_agency_key"
ON "LeadAssignmentExperiment" ("agencyId")
WHERE status = 'ACTIVE';

ALTER TABLE "LeadAssignmentExperiment"
ADD CONSTRAINT "LeadAssignmentExperiment_smartPercent_check"
CHECK ("smartPercent" BETWEEN 10 AND 90);
