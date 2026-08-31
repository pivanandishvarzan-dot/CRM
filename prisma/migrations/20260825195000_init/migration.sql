CREATE TYPE "Role" AS ENUM ('SYSTEM_ADMIN', 'AGENCY_MANAGER', 'AGENT');
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'NEGOTIATING', 'SOLD', 'RENTED', 'ARCHIVED');
CREATE TYPE "DealType" AS ENUM ('SALE', 'RENT', 'MORTGAGE_RENT');
CREATE TYPE "FollowupType" AS ENUM ('CALL', 'MESSAGE', 'MEETING', 'VISIT', 'REMINDER', 'TASK');

CREATE TABLE "Agency" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT,
  "role" "Role" NOT NULL DEFAULT 'AGENT',
  "agencyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Owner" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "address" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Property" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "dealType" "DealType" NOT NULL,
  "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',
  "city" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "address" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "price" DECIMAL(18,2) NOT NULL,
  "deposit" DECIMAL(18,2),
  "rent" DECIMAL(18,2),
  "area" INTEGER NOT NULL,
  "rooms" INTEGER NOT NULL,
  "floor" INTEGER,
  "age" INTEGER,
  "features" TEXT[] NOT NULL,
  "images" TEXT[] NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "ownerId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Applicant" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "requestType" "DealType" NOT NULL,
  "budgetMin" DECIMAL(18,2),
  "budgetMax" DECIMAL(18,2),
  "cities" TEXT[] NOT NULL,
  "districts" TEXT[] NOT NULL,
  "propertyTypes" TEXT[] NOT NULL,
  "minRooms" INTEGER,
  "requiredFeatures" TEXT[] NOT NULL,
  "urgency" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "agentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Followup" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" "FollowupType" NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 1,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT,
  "assigneeId" TEXT NOT NULL,
  "ownerId" TEXT,
  "applicantId" TEXT,
  "propertyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Followup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contract" (
  "id" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "commission" DECIMAL(18,2) NOT NULL,
  "contractDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL,
  "paymentDetails" JSONB,
  "notes" TEXT,
  "propertyId" TEXT NOT NULL,
  "applicantId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Property_code_key" ON "Property"("code");
CREATE UNIQUE INDEX "Contract_number_key" ON "Contract"("number");

ALTER TABLE "User" ADD CONSTRAINT "User_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Property" ADD CONSTRAINT "Property_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Followup" ADD CONSTRAINT "Followup_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Followup" ADD CONSTRAINT "Followup_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Followup" ADD CONSTRAINT "Followup_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Followup" ADD CONSTRAINT "Followup_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
