import { isDemoMode, prisma } from '@/lib/prisma';
import type { DataActor } from '@/lib/data-scope';
import { applicantScope, followupScope, propertyScope } from '@/lib/data-scope';

const DAY = 86400000;

export async function refreshSmartAlerts(actor: DataActor) {
  if (isDemoMode) return [];
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * DAY);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY);
  const [applicants, properties, overdue] = await Promise.all([
    prisma.applicant.findMany({ where: { ...applicantScope(actor), status: { notIn: ['WON'] }, updatedAt: { lt: threeDaysAgo } }, select: { id:true,name:true,status:true,agentId:true,updatedAt:true } }),
    prisma.property.findMany({ where: { ...propertyScope(actor), status: { in: ['ACTIVE','NEGOTIATING'] }, updatedAt: { lt: fourteenDaysAgo } }, select: { id:true,title:true,agentId:true,updatedAt:true } }),
    prisma.followup.findMany({ where: { ...followupScope(actor), completed:false, scheduledAt:{ lt: now } }, select: { id:true,title:true,assigneeId:true,scheduledAt:true } }),
  ]);
  const desired = [
    ...applicants.map(x=>({key:`stale-applicant:${x.id}`,userId:x.agentId,type:'PIPELINE_STALE',severity:3,title:'متقاضی در Pipeline متوقف شده',message:`${x.name} بیش از ۳ روز در مرحله ${x.status} بدون تغییر مانده است.`,entityType:'APPLICANT',entityId:x.id,href:`/applicants/${x.id}`})),
    ...properties.map(x=>({key:`stale-property:${x.id}`,userId:x.agentId,type:'PROPERTY_STALE',severity:2,title:'فایل نیازمند پیگیری',message:`برای ${x.title} بیش از ۱۴ روز فعالیت جدیدی ثبت نشده است.`,entityType:'PROPERTY',entityId:x.id,href:`/properties/${x.id}`})),
    ...overdue.map(x=>({key:`overdue-followup:${x.id}`,userId:x.assigneeId,type:'FOLLOWUP_OVERDUE',severity:4,title:'پیگیری عقب‌افتاده',message:`${x.title} از زمان برنامه‌ریزی‌شده عبور کرده و هنوز تکمیل نشده است.`,entityType:'FOLLOWUP',entityId:x.id,href:'/followups'})),
  ];
  const visible = desired.filter(x => actor.role === 'SYSTEM_ADMIN' || x.userId === actor.id || actor.role === 'AGENCY_MANAGER');
  await Promise.all(visible.map(item => prisma.alert.upsert({ where:{key:item.key}, create:item, update:{...item,resolvedAt:null} })));
  const activeKeys = visible.map(x=>x.key);
  await prisma.alert.updateMany({ where:{ userId: actor.role==='AGENT'?actor.id:undefined, resolvedAt:null, ...(activeKeys.length?{key:{notIn:activeKeys}}:{}) }, data:{resolvedAt:now} });
  return listAlerts(actor);
}

export async function listAlerts(actor: DataActor) {
  if (isDemoMode) return [];
  const userWhere = actor.role === 'AGENT' ? { userId: actor.id } : actor.role === 'AGENCY_MANAGER' ? { user: { agencyId: actor.agencyId ?? '__none__' } } : {};
  return prisma.alert.findMany({ where:{...userWhere,resolvedAt:null}, include:{user:{select:{id:true,name:true}}}, orderBy:[{severity:'desc'},{createdAt:'desc'}], take:50 });
}

export async function markAlertRead(id:string, actor:DataActor) {
  if (isDemoMode) return {id,readAt:new Date()};
  const allowed = await listAlerts(actor); if(!allowed.some(x=>x.id===id)) throw new Error('NOT_FOUND');
  return prisma.alert.update({where:{id},data:{readAt:new Date()}});
}
