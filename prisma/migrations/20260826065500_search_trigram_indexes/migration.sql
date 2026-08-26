CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Property_title_trgm_idx" ON "Property" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "Property_code_trgm_idx" ON "Property" USING GIN ("code" gin_trgm_ops);
CREATE INDEX "Property_district_trgm_idx" ON "Property" USING GIN ("district" gin_trgm_ops);
CREATE INDEX "Owner_name_trgm_idx" ON "Owner" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "Applicant_name_trgm_idx" ON "Applicant" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "Applicant_email_trgm_idx" ON "Applicant" USING GIN ("email" gin_trgm_ops);
CREATE INDEX "Contract_number_trgm_idx" ON "Contract" USING GIN ("number" gin_trgm_ops);
