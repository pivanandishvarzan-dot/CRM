import { applicants as demoApplicants, owners as demoOwners } from '@/lib/demo-data';
import { isDemoMode } from '@/lib/data-mode';
import { prisma } from '@/lib/prisma';

export type OwnerItem = { id:string; name:string; phone:string; email?:string; note:string; agent:string; propertyCount:number };
export type ApplicantItem = { id:string; name:string; phone:string; request:string; budget:string; urgency:string; agent:string; notes:string };

type OwnerInput = { name:string; phone:string; email?:string; notes?:string };
type ApplicantInput = { name:string; phone:string; requestType:'SALE'|'RENT'|'MORTGAGE_RENT'; budgetMax?:number; urgency?:number; agentId?:string; notes?:string };

let demoOwnerStore: OwnerItem[] = demoOwners.map((o:any,i:number)=>({id:String(o.id),name:o.name,phone:o.phone,note:o.note??'',agent:o.agent??'—',propertyCount:[2,2,1,1,1][i]??0}));
let demoApplicantStore: ApplicantItem[] = demoApplicants.map((a:any)=>({id:String(a.id),name:a.name,phone:a.phone,request:a.request,budget:a.budget,urgency:a.urgency,agent:a.agent,notes:''}));

const dealLabel={SALE:'خرید',RENT:'اجاره',MORTGAGE_RENT:'رهن و اجاره'} as const;
const urgencyLabel=(n:number)=>n>=3?'فوری':n===2?'زیاد':'عادی';

export async function listOwners():Promise<OwnerItem[]>{
 if(isDemoMode()) return demoOwnerStore;
 const rows=await prisma.owner.findMany({include:{properties:{select:{id:true,agent:{select:{name:true}}}}},orderBy:{createdAt:'desc'}});
 return rows.map(o=>({id:o.id,name:o.name,phone:o.phone,email:o.email??undefined,note:o.notes??'',agent:o.properties[0]?.agent.name??'—',propertyCount:o.properties.length}));
}
export async function createOwner(input:OwnerInput):Promise<OwnerItem>{
 if(isDemoMode()){const item={id:`demo-owner-${Date.now()}`,name:input.name,phone:input.phone,email:input.email,note:input.notes??'',agent:'—',propertyCount:0};demoOwnerStore=[item,...demoOwnerStore];return item;}
 const o=await prisma.owner.create({data:{name:input.name,phone:input.phone,email:input.email||null,notes:input.notes||null}});
 return {id:o.id,name:o.name,phone:o.phone,email:o.email??undefined,note:o.notes??'',agent:'—',propertyCount:0};
}
export async function deleteOwner(id:string){if(isDemoMode()){demoOwnerStore=demoOwnerStore.filter(x=>x.id!==id);return;}await prisma.owner.delete({where:{id}});}

export async function listApplicants():Promise<ApplicantItem[]>{
 if(isDemoMode()) return demoApplicantStore;
 const rows=await prisma.applicant.findMany({include:{agent:true},orderBy:{createdAt:'desc'}});
 return rows.map(a=>({id:a.id,name:a.name,phone:a.phone,request:dealLabel[a.requestType],budget:a.budgetMax?`${Number(a.budgetMax)/1_000_000_000} میلیارد`:'توافقی',urgency:urgencyLabel(a.urgency),agent:a.agent.name,notes:a.notes??''}));
}
export async function createApplicant(input:ApplicantInput):Promise<ApplicantItem>{
 if(isDemoMode()){const item={id:`demo-applicant-${Date.now()}`,name:input.name,phone:input.phone,request:dealLabel[input.requestType],budget:input.budgetMax?`${input.budgetMax} میلیارد`:'توافقی',urgency:urgencyLabel(input.urgency??1),agent:'مشاور دمو',notes:input.notes??''};demoApplicantStore=[item,...demoApplicantStore];return item;}
 let agentId=input.agentId; if(!agentId){const agent=await prisma.user.findFirst({orderBy:{createdAt:'asc'}});if(!agent) throw new Error('NO_AGENT');agentId=agent.id;}
 const a=await prisma.applicant.create({data:{name:input.name,phone:input.phone,requestType:input.requestType,budgetMax:input.budgetMax?input.budgetMax*1_000_000_000:null,cities:[],districts:[],propertyTypes:[],requiredFeatures:[],urgency:input.urgency??1,notes:input.notes||null,agentId},include:{agent:true}});
 return {id:a.id,name:a.name,phone:a.phone,request:dealLabel[a.requestType],budget:a.budgetMax?`${Number(a.budgetMax)/1_000_000_000} میلیارد`:'توافقی',urgency:urgencyLabel(a.urgency),agent:a.agent.name,notes:a.notes??''};
}
export async function deleteApplicant(id:string){if(isDemoMode()){demoApplicantStore=demoApplicantStore.filter(x=>x.id!==id);return;}await prisma.applicant.delete({where:{id}});}
