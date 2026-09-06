-- Add nullable agency ownership to existing owners.
ALTER TABLE "Owner" ADD COLUMN "agencyId" TEXT;

-- Backfill only owners whose existing properties all resolve to one agency.
-- Ambiguous cross-agency owners and owners without properties remain NULL for manual review.
WITH owner_agency AS (
  SELECT
    p."ownerId",
    MIN(u."agencyId") AS "agencyId"
  FROM "Property" p
  JOIN "User" u ON u."id" = p."agentId"
  WHERE u."agencyId" IS NOT NULL
  GROUP BY p."ownerId"
  HAVING COUNT(DISTINCT u."agencyId") = 1
)
UPDATE "Owner" o
SET "agencyId" = oa."agencyId"
FROM owner_agency oa
WHERE o."id" = oa."ownerId";

CREATE INDEX "Owner_agencyId_idx" ON "Owner"("agencyId");

ALTER TABLE "Owner"
ADD CONSTRAINT "Owner_agencyId_fkey"
FOREIGN KEY ("agencyId") REFERENCES "Agency"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
