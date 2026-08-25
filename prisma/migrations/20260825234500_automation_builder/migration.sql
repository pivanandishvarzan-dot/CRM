ALTER TABLE "AutomationRule" ADD COLUMN "trigger" JSONB;
ALTER TABLE "AutomationRule" ADD COLUMN "conditions" JSONB;
ALTER TABLE "AutomationRule" ADD COLUMN "actionConfig" JSONB;
ALTER TABLE "AutomationRule" ADD COLUMN "custom" BOOLEAN NOT NULL DEFAULT false;
