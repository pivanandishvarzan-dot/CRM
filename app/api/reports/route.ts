import {NextResponse} from 'next/server';
import {isDemoMode} from '@/lib/data-mode';
import {prisma} from '@/lib/prisma';
import {agents} from '@/lib/demo-data';
import {apiAccessStatus,requireApiPermission} from '@/lib/api-access';
export const dynamic='force-dynamic';

export async function GET(){
 try{
  await requireApiPermission('VIEW_REPORTS');
  if(isDemoMode())return NextResponse.json({data:{kpis:{conversionRate:23.8,averageDealDays:18,completionRate:96},agents:agents.map((a:any)=>({name:a.name,deals:a.deals,value:a.value,rate:a.rate}))}});
  const [applicants,contracts,completed]=await Promise.all([
   prisma.applicant.count(),
   prisma.contract.findMany({select:{amount:true,contractDate:true,createdAt:true,status:true,agent:{select:{id:true,name:true}}}}),
   prisma.contract.count({where:{status:{in:['COMPLETED','تکمیل شده']}}})
  ]);
  const conversionRate=applicants?completed/applicants*100:0;
  const completedRows=contracts.filter(c=>['COMPLETED','تکمیل شده'].includes(c.status));
  const averageDealDays=completedRows.length?completedRows.reduce((s,c)=>s+Math.max(0,(c.contractDate.getTime()-c.createdAt.getTime())/86400000),0)/completedRows.length:0;
  const completionRate=contracts.length?completed/contracts.length*100:0;
  const map=new Map<string,{name:string;deals:number;value:number}>();
  for(const c of completedRows){const x=map.get(c.agent.id)??{name:c.agent.name,deals:0,value:0};x.deals++;x.value+=Number(c.amount);map.set(c.agent.id,x)}
  const ranking=[...map.values()].map(x=>({...x,value:x.value/1e9,rate:applicants?x.deals/applicants*100:0})).sort((a,b)=>b.value-a.value);
  return NextResponse.json({data:{kpis:{conversionRate,averageDealDays,completionRate},agents:ranking}})
 }catch(e){
  console.error(e);
  return NextResponse.json({error:apiAccessStatus(e)===500?'خطا در محاسبه گزارش‌ها':'دسترسی غیرمجاز'},{status:apiAccessStatus(e)})
 }
}
