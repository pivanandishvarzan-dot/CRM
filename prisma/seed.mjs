import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const seedPassword = process.env.SEED_PASSWORD || 'demo1234';
  if (seedPassword.length < 8) throw new Error('SEED_PASSWORD must contain at least 8 characters.');
  const passwordHash = await hash(seedPassword, 12);

  const agency = await prisma.agency.upsert({
    where: { id: 'seed-agency' }, update: { name: 'آژانس نمونه خانه‌یار' }, create: { id: 'seed-agency', name: 'آژانس نمونه خانه‌یار' },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.local' },
    update: { name: 'مهدی اکبری', role: 'AGENCY_MANAGER', agencyId: agency.id, passwordHash },
    create: { name: 'مهدی اکبری', email: 'manager@demo.local', role: 'AGENCY_MANAGER', agencyId: agency.id, passwordHash },
  });
  const agent = await prisma.user.upsert({
    where: { email: 'agent@demo.local' },
    update: { name: 'مشاور نمونه', role: 'AGENT', agencyId: agency.id, passwordHash },
    create: { name: 'مشاور نمونه', email: 'agent@demo.local', role: 'AGENT', agencyId: agency.id, passwordHash },
  });

  const owner = await prisma.owner.upsert({ where: { id: 'seed-owner' }, update: { name: 'مالک نمونه', phone: '09120000000', notes: 'داده seed برای توسعه محلی' }, create: { id: 'seed-owner', name: 'مالک نمونه', phone: '09120000000', notes: 'داده seed برای توسعه محلی' } });
  const property = await prisma.property.upsert({ where: { code: 'MLK-SEED-001' }, update: { agentId: agent.id, ownerId: owner.id }, create: { code: 'MLK-SEED-001', title: 'آپارتمان نمونه پاسداران', type: 'آپارتمان', dealType: 'SALE', status: 'ACTIVE', city: 'تهران', district: 'پاسداران', price: 18.5, area: 145, rooms: 3, floor: 4, age: 6, features: ['پارکینگ', 'آسانسور', 'انباری'], images: [], ownerId: owner.id, agentId: agent.id } });
  const applicant = await prisma.applicant.upsert({ where: { id: 'seed-applicant' }, update: { agentId: agent.id }, create: { id: 'seed-applicant', name: 'متقاضی نمونه', phone: '09121111111', requestType: 'SALE', budgetMin: 15, budgetMax: 22, cities: ['تهران'], districts: ['پاسداران'], propertyTypes: ['آپارتمان'], minRooms: 2, requiredFeatures: ['پارکینگ'], urgency: 3, status: 'QUALIFIED', agentId: agent.id } });
  await prisma.followup.upsert({ where: { id: 'seed-followup' }, update: { assigneeId: agent.id, applicantId: applicant.id, propertyId: property.id }, create: { id: 'seed-followup', title: 'هماهنگی بازدید ملک نمونه', type: 'VISIT', scheduledAt: new Date(Date.now() + 86400000), priority: 3, assigneeId: agent.id, ownerId: owner.id, applicantId: applicant.id, propertyId: property.id } });
  await prisma.contract.upsert({ where: { number: 'Q-SEED-001' }, update: { agentId: agent.id, propertyId: property.id, applicantId: applicant.id }, create: { number: 'Q-SEED-001', type: 'فروش', amount: 18.5, commission: 0.185, contractDate: new Date(), status: 'DRAFT', propertyId: property.id, applicantId: applicant.id, agentId: agent.id } });

  console.log('Seed completed. Accounts: manager@demo.local and agent@demo.local. Password comes from SEED_PASSWORD (default is for local development only).');
}

main().catch(error => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
