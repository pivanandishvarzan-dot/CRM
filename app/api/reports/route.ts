import {NextResponse} from 'next/server';
import {isDemoMode} from '@/lib/data-mode';
import {prisma} from '@/lib/prisma';
import {agents} from '@/lib/demo-data';
import {apiAccessMessage,apiAccessStatus,ApiAccessError,requireApiPermission} from '@/lib/api-access';

export const dynamic='force-dynamic';

export async function GET(){
 try{
  const session=await requireApiPermission('VIEW_REPORTS');
  if(isDemoMode())return NextResponse.json({data:{kpis:{conversionRate:23.8,averageDealDays:18,completionRate:96},agents:agents.map((a:any)=>({name:a.name,deals:a.deals,value:a.value,rate:a.rate}))}});

  let agencyId:string|undefined;
  if(session.user.role!=='SYSTEM_ADMIN'){
   const actor=await prisma.user.findUnique({where:{id:session.user.id},select:{agencyId:true}});
   if(!actor?.agencyId)throw new ApiAccessError(403,'کاربر به آژانسی متصل نیست');
   agencyId=actor.agencyId;
  }

  const applicantWhere=agencyId?{agent:{agencyId}}:undefined;
  const contractWhere=agencyId?{agent:{agencyId}}:undefined;
  const completedWhere=agencyId?{agent:{agencyId},status:{in:['COMPLETED','تکمیل شده']}}:{status:{in:['COMPLETED','تکمیل شده']}};

  const [applicants,contracts,completed]=await Promise.all([
   prisma.applicant.count({where:applicantWhere}),
   prisma.contract.findMany({where:contractWhere,select:{amount:true,contractDate:true,createdAt:true,status:true,agent:{select:{id:true,name:true}}}}),
   prisma.contract.count({where:completedWhere})
  ]);
  const conversionRate=applicants?completed/applicants*100:0;
  const completedRows=contracts.filter(c=>['COMPLETED','تکمیل شده'].includes(c.status));
  const averageDealDays=completedRows.length?completedRows.reduce((s,c)=>s+Math.max(0,(c.contractDate.getTime()-c.createdAt.getTime())/86400000),0)/completedRows.length:0;
  const completionRate=contracts.length?completed/contracts.length*100:0;
  const map=new Map<string,{name:string;deals:number;value:number}>();
  for(const c of completedRows){const x=map.get(c.agent.id)??{name:c.agent.name,deals:0,value:0};x.deals++;x.value+=Number(c.amount);map.set(c.agent.id,x)}
  const ranking=[...map.values()].map(x=>({...x,value:x.value/1e9,rate:applicants?x.deals/applicants*100:0})).sort((a,b)=>b.value-a.value);
  return NextResponse.json({data:{kpis:{conversionRate,averageDealDays,completionRate},agents:ranking}});
 }catch(e){
  console.error(e);
  return NextResponse.json({error:apiAccessMessage(e,'خطا در محاسبه گزارش‌ها')},{status:apiAccessStatus(e)});
 }
}
