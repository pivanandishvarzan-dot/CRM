import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { propertyScope, applicantScope, contractScope, followupScope } from '@/lib/data-scope';

export async function GET() {
  const actor = await requireRole(['SYSTEM_ADMIN','AGENCY_MANAGER']);
  const [properties, applicants, contracts, followups, owners, users] = await Promise.all([
    prisma.property.findMany({ where: propertyScope(actor), include: { owner:true, agent:{select:{id:true,name:true,email:true}} } }),
    prisma.applicant.findMany({ where: applicantScope(actor), include: { agent:{select:{id:true,name:true,email:true}} } }),
    prisma.contract.findMany({ where: contractScope(actor), include: { agent:{select:{id:true,name:true,email:true}}, property:{select:{id:true,code:true,title:true}}, applicant:{select:{id:true,name:true,phone:true}} } }),
    prisma.followup.findMany({ where: followupScope(actor), include: { assignee:{select:{id:true,name:true,email:true}} } }),
    prisma.owner.findMany({ where: actor.role==='SYSTEM_ADMIN'?{}:{properties:{some:{agent:{agencyId:actor.agencyId??'__none__'}}}} }),
    prisma.user.findMany({ where: actor.role==='SYSTEM_ADMIN'?{}:{agencyId:actor.agencyId??'__none__'}, select:{id:true,name:true,email:true,role:true,active:true,agencyId:true,createdAt:true} }),
  ]);
  const payload = { exportedAt:new Date().toISOString(), scope:actor.role==='SYSTEM_ADMIN'?'SYSTEM':actor.agencyId, version:1, data:{users,owners,properties,applicants,contracts,followups} };
  return new NextResponse(JSON.stringify(payload,null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="crm-emergency-${new Date().toISOString().slice(0,10)}.json"`,'Cache-Control':'no-store'}});
}
