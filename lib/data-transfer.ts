import * as XLSX from 'xlsx';
import { prisma, isDemoMode } from '@/lib/prisma';
import type { DataActor } from '@/lib/data-scope';
import { applicantScope, propertyScope } from '@/lib/data-scope';
import { createApplicant } from '@/lib/repositories/applicant-repository';
import { createOwner } from '@/lib/repositories/owner-repository';
import { createProperty } from '@/lib/repositories/property-repository';

type Entity = 'properties'|'owners'|'applicants';
function s(v:unknown){return String(v??'').trim()}
function n(v:unknown){const x=Number(String(v??'').replace(/,/g,''));return Number.isFinite(x)?x:undefined}
function list(v:unknown){return s(v).split(/[،,;]/).map(x=>x.trim()).filter(Boolean)}

export async function exportWorkbook(entity:Entity, actor:DataActor){
  if(isDemoMode) throw new Error('DEMO_EXPORT_UNAVAILABLE');
  let rows:any[]=[];
  if(entity==='properties'){
    const data=await prisma.property.findMany({where:propertyScope(actor),include:{owner:true,agent:true},orderBy:{createdAt:'desc'}});
    rows=data.map(x=>({کد:x.code,عنوان:x.title,نوع:x.type,معامله:x.dealType,وضعیت:x.status,شهر:x.city,منطقه:x.district,آدرس:x.address||'',قیمت:Number(x.price),متراژ:x.area,خواب:x.rooms,طبقه:x.floor??'',سن_بنا:x.age??'',امکانات:x.features.join('، '),مالک:x.owner.name,تلفن_مالک:x.owner.phone,مشاور:x.agent.name}));
  }else if(entity==='owners'){
    const agentIds=actor.role==='SYSTEM_ADMIN'?undefined:(await prisma.user.findMany({where:actor.role==='AGENT'?{id:actor.id}:{agencyId:actor.agencyId??'__none__'},select:{id:true}})).map(x=>x.id);
    const data=await prisma.owner.findMany({where:agentIds?{properties:{some:{agentId:{in:agentIds}}}}:{},orderBy:{createdAt:'desc'}});
    rows=data.map(x=>({نام:x.name,تلفن:x.phone,ایمیل:x.email||'',آدرس:x.address||'',یادداشت:x.notes||''}));
  }else{
    const data=await prisma.applicant.findMany({where:applicantScope(actor),include:{agent:true},orderBy:{createdAt:'desc'}});
    rows=data.map(x=>({نام:x.name,تلفن:x.phone,ایمیل:x.email||'',نوع_درخواست:x.requestType,بودجه_حداقل:x.budgetMin?Number(x.budgetMin):'',بودجه_حداکثر:x.budgetMax?Number(x.budgetMax):'',شهرها:x.cities.join('، '),مناطق:x.districts.join('، '),انواع_ملک:x.propertyTypes.join('، '),حداقل_خواب:x.minRooms??'',امکانات_ضروری:x.requiredFeatures.join('، '),فوریت:x.urgency,مرحله:x.status,مشاور:x.agent.name,یادداشت:x.notes||''}));
  }
  const wb=XLSX.utils.book_new();const ws=XLSX.utils.json_to_sheet(rows);ws['!dir']='rtl';XLSX.utils.book_append_sheet(wb,ws,entity);return XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
}

export async function importWorkbook(file:ArrayBuffer,entity:Entity,actor:DataActor){
  if(isDemoMode) throw new Error('DEMO_IMPORT_UNAVAILABLE');
  const wb=XLSX.read(file,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json<Record<string,unknown>>(ws,{defval:''});
  const errors:{row:number;message:string}[]=[];let imported=0;
  for(let i=0;i<rows.length;i++){
    const r=rows[i];try{
      if(entity==='owners'){
        await createOwner({name:s(r['نام']||r['name']),phone:s(r['تلفن']||r['phone']),email:s(r['ایمیل']||r['email'])||undefined,address:s(r['آدرس']||r['address'])||undefined,notes:s(r['یادداشت']||r['notes'])||undefined});
      }else if(entity==='applicants'){
        const agentId=actor.role==='AGENT'?actor.id:s(r['agentId'])||undefined;
        await createApplicant({name:s(r['نام']||r['name']),phone:s(r['تلفن']||r['phone']),requestType:s(r['نوع_درخواست']||r['requestType']||'SALE'),budgetMin:n(r['بودجه_حداقل']||r['budgetMin']),budgetMax:n(r['بودجه_حداکثر']||r['budgetMax']),cities:list(r['شهرها']||r['cities']),districts:list(r['مناطق']||r['districts']),propertyTypes:list(r['انواع_ملک']||r['propertyTypes']),minRooms:n(r['حداقل_خواب']||r['minRooms']),requiredFeatures:list(r['امکانات_ضروری']||r['requiredFeatures']),urgency:n(r['فوریت']||r['urgency'])||1,notes:s(r['یادداشت']||r['notes'])||undefined,agentId},actor);
      }else{
        const ownerName=s(r['مالک']||r['owner']);const ownerPhone=s(r['تلفن_مالک']||r['ownerPhone']);if(!ownerName||!ownerPhone)throw new Error('نام و تلفن مالک الزامی است.');
        let owner=await prisma.owner.findFirst({where:{phone:ownerPhone}});if(!owner)owner=await createOwner({name:ownerName,phone:ownerPhone});
        const agentId=actor.role==='AGENT'?actor.id:s(r['agentId'])||undefined;
        await createProperty({title:s(r['عنوان']||r['title']),type:s(r['نوع']||r['type']),deal:s(r['معامله']||r['deal']||'SALE'),status:s(r['وضعیت']||r['status'])||undefined,city:s(r['شهر']||r['city']),district:s(r['منطقه']||r['district']),address:s(r['آدرس']||r['address'])||undefined,price:n(r['قیمت']||r['price'])||0,area:n(r['متراژ']||r['area'])||0,rooms:n(r['خواب']||r['rooms'])||0,floor:n(r['طبقه']||r['floor']),age:n(r['سن_بنا']||r['age']),features:list(r['امکانات']||r['features']),ownerId:owner.id,agentId,code:s(r['کد']||r['code'])||undefined},actor);
      }
      imported++;
    }catch(e){errors.push({row:i+2,message:e instanceof Error?e.message:'خطای ناشناخته'});}
  }
  return {total:rows.length,imported,failed:errors.length,errors};
}
