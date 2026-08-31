import { isDemoMode, prisma } from '@/lib/prisma';
import type { DataActor } from '@/lib/data-scope';
import { applicantScope, followupScope, propertyScope } from '@/lib/data-scope';
import { ensureAutomationRules } from '@/lib/repositories/automation-repository';

const DAY = 86400000;

export async function refreshSmartAlerts(actor: DataActor) {
  if (isDemoMode) return [];
  const now = new Date();
  const rules = await ensureAutomationRules(actor);
  const byType = Object.fromEntries(rules.filter(r=>r.enabled).map(r=>[r.type,r]));
  const pipelineRule = byType.PIPELINE_STALE;
  const propertyRule = byType.PROPERTY_STALE;
  const followupRule = byType.FOLLOWUP_OVERDUE;

  const [applicants, properties, overdue] = await Promise.all([
    pipelineRule ? prisma.applicant.findMany({ where: { ...applicantScope(actor), status:{notIn:['WON']}, updatedAt:{lt:new Date(now.getTime()-pipelineRule.thresholdDays*DAY)} }, select:{id:true,name:true,status:true,agentId:true} }) : Promise.resolve([]),
    propertyRule ? prisma.property.findMany({ where: { ...propertyScope(actor), status:{in:['ACTIVE','NEGOTIATING']}, updatedAt:{lt:new Date(now.getTime()-propertyRule.thresholdDays*DAY)} }, select:{id:true,title:true,agentId:true} }) : Promise.resolve([]),
    followupRule ? prisma.followup.findMany({ where:{ ...followupScope(actor), completed:false, scheduledAt:{lt:new Date(now.getTime()-followupRule.thresholdDays*DAY)} }, select:{id:true,title:true,assigneeId:true,scheduledAt:true,applicantId:true,propertyId:true} }) : Promise.resolve([]),
  ]);

  const desired = [
    ...applicants.map(x=>({key:`pipeline-stale:${x.id}`,userId:x.agentId,type:'PIPELINE_STALE',severity:pipelineRule.priority,title:'متقاضی در Pipeline متوقف شده',message:`${x.name} بیش از ${pipelineRule.thresholdDays} روز در مرحله ${x.status} بدون تغییر مانده است.`,entityType:'APPLICANT',entityId:x.id,href:`/applicants/${x.id}`,action:pipelineRule.action})),
    ...properties.map(x=>({key:`property-stale:${x.id}`,userId:x.agentId,type:'PROPERTY_STALE',severity:propertyRule.priority,title:'فایل نیازمند پیگیری',message:`برای ${x.title} بیش از ${propertyRule.thresholdDays} روز فعالیت جدیدی ثبت نشده است.`,entityType:'PROPERTY',entityId:x.id,href:`/properties/${x.id}`,action:propertyRule.action})),
    ...overdue.map(x=>({key:`followup-overdue:${x.id}`,userId:x.assigneeId,type:'FOLLOWUP_OVERDUE',severity:followupRule.priority,title:'پیگیری عقب‌افتاده',message:`${x.title} از زمان برنامه‌ریزی‌شده عبور کرده و هنوز تکمیل نشده است.`,entityType:'FOLLOWUP',entityId:x.id,href:'/followups',action:followupRule.action})),
  ];

  const visible = desired.filter(x => actor.role === 'SYSTEM_ADMIN' || x.userId === actor.id || actor.role === 'AGENCY_MANAGER');
  for (const item of visible) {
    const existing = await prisma.alert.findUnique({where:{key:item.key},select:{id:true,createdAt:true}});
    await prisma.alert.upsert({where:{key:item.key},create:{key:item.key,userId:item.userId,type:item.type,severity:item.severity,title:item.title,message:item.message,entityType:item.entityType,entityId:item.entityId,href:item.href},update:{severity:item.severity,title:item.title,message:item.message,href:item.href,resolvedAt:null}});
    if (!existing && item.action === 'ALERT_AND_TASK') {
      await prisma.followup.create({data:{title:`پیگیری خودکار: ${item.title}`,type:'TASK',scheduledAt:now,priority:item.severity,completed:false,description:`[AUTO:${item.key}] ${item.message}`,assigneeId:item.userId}});
    }
  }
  const activeKeys = visible.map(x=>x.key);
  await prisma.alert.updateMany({where:{userId:actor.role==='AGENT'?actor.id:undefined,resolvedAt:null,...(activeKeys.length?{key:{notIn:activeKeys}}:{})},data:{resolvedAt:now}});
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
