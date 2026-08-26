import { isDemoMode, prisma } from '@/lib/prisma';
import type { DataActor } from '@/lib/data-scope';
import { applicantScope, contractScope, propertyScope } from '@/lib/data-scope';

const STAGES = ['LEAD','CONTACTED','QUALIFIED','MATCHED','VISIT','NEGOTIATION','CONTRACT','WON'] as const;
function monthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }

export async function getAdvancedReports(actor: DataActor, from?: Date, to?: Date) {
  if (isDemoMode) {
    const counts = STAGES.map((stage, i) => ({ stage, count: Math.max(0, 16 - i * 2) }));
    const total = counts.reduce((sum, x) => sum + x.count, 0) || 1;
    return { range:{from:from?.toISOString()??null,to:to?.toISOString()??null},kpis:{avgDaysToContract:12,staleProperties:4,totalValue:248.5,totalCommission:2.48},funnel:counts.map(x=>({...x,shareOfPipeline:Math.round((x.count/total)*100)})),monthly:[{month:'2026-04',value:18,commission:.18,contracts:2},{month:'2026-05',value:24,commission:.24,contracts:3},{month:'2026-06',value:31,commission:.31,contracts:4},{month:'2026-07',value:27,commission:.27,contracts:3},{month:'2026-08',value:42,commission:.42,contracts:5}],agents:[{name:'مشاور نمونه',applicants:12,contracts:4,conversionRate:33,value:42,commission:.42}],staleProperties:[] };
  }

  const dateFilter = from || to ? { gte: from, lte: to } : undefined;
  const applicantWhere:any={...applicantScope(actor),...(dateFilter&&{createdAt:dateFilter})};
  const contractWhere:any={...contractScope(actor),...(dateFilter&&{contractDate:dateFilter})};
  const propertyWhere:any={...propertyScope(actor),status:{in:['ACTIVE','NEGOTIATING']},...(dateFilter&&{createdAt:dateFilter})};

  const [applicantGroups, contracts, properties] = await Promise.all([
    prisma.applicant.groupBy({by:['status','agentId'],where:applicantWhere,_count:{_all:true}}),
    prisma.contract.findMany({where:contractWhere,select:{agentId:true,amount:true,commission:true,contractDate:true,status:true,applicant:{select:{createdAt:true}},agent:{select:{name:true}}},orderBy:{contractDate:'asc'}}),
    prisma.property.findMany({where:propertyWhere,select:{id:true,title:true,code:true,createdAt:true,agent:{select:{name:true}},followups:{select:{scheduledAt:true},orderBy:{scheduledAt:'desc'},take:1}}}),
  ]);

  const stageCounts=STAGES.map(stage=>({stage,count:applicantGroups.filter(x=>x.status===stage).reduce((s,x)=>s+x._count._all,0)}));
  const pipelineTotal=stageCounts.reduce((s,x)=>s+x.count,0)||1;
  const funnel=stageCounts.map(x=>({...x,shareOfPipeline:Math.round((x.count/pipelineTotal)*100)}));

  const monthlyMap=new Map<string,{month:string;value:number;commission:number;contracts:number}>();
  const agentMap=new Map<string,{name:string;applicants:number;contracts:number;value:number;commission:number}>();
  const applicantCountByAgent=new Map<string,number>();
  for(const group of applicantGroups) applicantCountByAgent.set(group.agentId,(applicantCountByAgent.get(group.agentId)||0)+group._count._all);
  for(const contract of contracts){const key=monthKey(contract.contractDate),m=monthlyMap.get(key)||{month:key,value:0,commission:0,contracts:0};m.value+=Number(contract.amount);m.commission+=Number(contract.commission);m.contracts++;monthlyMap.set(key,m);const a=agentMap.get(contract.agentId)||{name:contract.agent.name,applicants:applicantCountByAgent.get(contract.agentId)||0,contracts:0,value:0,commission:0};a.contracts++;a.value+=Number(contract.amount);a.commission+=Number(contract.commission);agentMap.set(contract.agentId,a)}
  for(const [agentId,count] of applicantCountByAgent){if(agentMap.has(agentId))continue;const user=await prisma.user.findUnique({where:{id:agentId},select:{name:true}});if(user)agentMap.set(agentId,{name:user.name,applicants:count,contracts:0,value:0,commission:0})}

  const now=Date.now();
  const staleProperties=properties.filter(p=>now-(p.followups[0]?.scheduledAt??p.createdAt).getTime()>14*86400000).map(p=>({id:p.id,title:p.title,code:p.code,agent:p.agent.name,lastActivityAt:p.followups[0]?.scheduledAt??p.createdAt}));
  const completed=contracts.filter(c=>['COMPLETED','SIGNED','WON','تکمیل شده','امضا شده'].includes(c.status));
  const avgDaysToContract=completed.length?Math.round(completed.reduce((s,c)=>s+Math.max(0,(c.contractDate.getTime()-c.applicant.createdAt.getTime())/86400000),0)/completed.length):0;

  return {range:{from:from?.toISOString()??null,to:to?.toISOString()??null},kpis:{avgDaysToContract,staleProperties:staleProperties.length,totalValue:contracts.reduce((s,c)=>s+Number(c.amount),0),totalCommission:contracts.reduce((s,c)=>s+Number(c.commission),0)},funnel,monthly:Array.from(monthlyMap.values()),agents:Array.from(agentMap.values()).map(x=>({...x,conversionRate:x.applicants?Math.round((x.contracts/x.applicants)*100):0})).sort((a,b)=>b.value-a.value),staleProperties};
}
