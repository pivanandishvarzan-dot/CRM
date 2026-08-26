import { DealType, Prisma, PropertyStatus } from '@prisma/client';
import { prisma, isDemoMode } from '@/lib/prisma';
import type { DataActor } from '@/lib/data-scope';
import { applicantScope, propertyScope } from '@/lib/data-scope';
import { matchProperties } from '@/lib/matching/property-matcher';
import type { Property } from '@/lib/types';

const dealLabel:Record<DealType,string>={SALE:'فروش',RENT:'اجاره',MORTGAGE_RENT:'رهن و اجاره'};
const statusLabel:Record<PropertyStatus,string>={DRAFT:'پیش‌نویس',ACTIVE:'فعال',NEGOTIATING:'در مذاکره',SOLD:'فروخته شد',RENTED:'اجاره داده شد',ARCHIVED:'آرشیو'};
function dealType(value:DealType){return value}
export async function findApplicantMatches(actor:DataActor,applicantId:string,limit=12){
 if(isDemoMode)return[];
 const applicant=await prisma.applicant.findFirst({where:{id:applicantId,...applicantScope(actor)},select:{requestType:true,budgetMin:true,budgetMax:true,cities:true,districts:true,propertyTypes:true,minRooms:true,requiredFeatures:true}});
 if(!applicant)return null;
 const max=applicant.budgetMax==null?undefined:Number(applicant.budgetMax)*1.15;
 const where:Prisma.PropertyWhereInput={...propertyScope(actor),status:{in:['ACTIVE','NEGOTIATING']},dealType:dealType(applicant.requestType),...(max!==undefined?{price:{lte:max}}:{}),...(applicant.cities.length?{city:{in:applicant.cities}}:{}),...(applicant.propertyTypes.length?{type:{in:applicant.propertyTypes}}:{})};
 let candidates=await prisma.property.findMany({where,select:{id:true,title:true,code:true,type:true,dealType:true,status:true,city:true,district:true,price:true,area:true,rooms:true,floor:true,age:true,features:true,images:true,createdAt:true,owner:{select:{name:true}},agent:{select:{name:true}}},orderBy:{updatedAt:'desc'},take:80});
 if(candidates.length<8&&applicant.districts.length){candidates=await prisma.property.findMany({where:{...propertyScope(actor),status:{in:['ACTIVE','NEGOTIATING']},dealType:dealType(applicant.requestType),...(max!==undefined?{price:{lte:max}}:{})},select:{id:true,title:true,code:true,type:true,dealType:true,status:true,city:true,district:true,price:true,area:true,rooms:true,floor:true,age:true,features:true,images:true,createdAt:true,owner:{select:{name:true}},agent:{select:{name:true}}},orderBy:{updatedAt:'desc'},take:80})}
 const properties:Property[]=candidates.map(x=>({id:x.id,title:x.title,code:x.code,type:x.type,deal:dealLabel[x.dealType],area:x.area,rooms:x.rooms,district:x.district,city:x.city,price:Number(x.price),status:statusLabel[x.status],owner:x.owner.name,agent:x.agent.name,image:x.images[0]||'',images:x.images,created:new Intl.DateTimeFormat('fa-IR-u-ca-persian').format(x.createdAt),floor:x.floor??0,age:x.age??0,features:x.features}));
 return matchProperties({requestType:dealLabel[applicant.requestType],budgetMin:applicant.budgetMin==null?null:Number(applicant.budgetMin),budgetMax:applicant.budgetMax==null?null:Number(applicant.budgetMax),cities:applicant.cities,districts:applicant.districts,propertyTypes:applicant.propertyTypes,minRooms:applicant.minRooms,requiredFeatures:applicant.requiredFeatures},properties).slice(0,Math.max(1,Math.min(limit,30)));
}
