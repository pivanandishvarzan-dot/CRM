import {NextResponse} from 'next/server';
import {isDemoMode} from '@/lib/data-mode';
import {prisma} from '@/lib/prisma';
import {apiAccessMessage,apiAccessStatus,ApiAccessError,requireApiPermission} from '@/lib/api-access';
import type {AppRole} from '@/lib/permissions';

const demoUsers:{id:string;name:string;email:string;role:AppRole}[]=[
  {id:'demo-manager',name:'مدیر آژانس',email:'manager@demo.local',role:'AGENCY_MANAGER'},
  {id:'demo-agent-1',name:'علی رضایی',email:'ali@demo.local',role:'AGENT'},
  {id:'demo-agent-2',name:'سارا محمدی',email:'sara@demo.local',role:'AGENT'},
];
let demoAgencyName='آژانس املاک خانه‌یار';

export const dynamic='force-dynamic';

async function getActor(userId:string){
  const actor=await prisma.user.findUnique({where:{id:userId},select:{id:true,role:true,agencyId:true}});
  if(!actor)throw new ApiAccessError(401,'کاربر معتبر نیست');
  return actor;
}

export async function GET(){
  try{
    const session=await requireApiPermission('MANAGE_SETTINGS');
    if(isDemoMode()) return NextResponse.json({data:{mode:'demo',agency:{id:'demo',name:demoAgencyName},users:demoUsers}});
    const actor=await getActor(session.user.id);
    if(actor.role!=='SYSTEM_ADMIN'&&!actor.agencyId)throw new ApiAccessError(403,'کاربر به آژانسی متصل نیست');
    const [agency,users]=await Promise.all([
      actor.role==='SYSTEM_ADMIN'
        ? prisma.agency.findFirst({orderBy:{createdAt:'asc'}})
        : prisma.agency.findUnique({where:{id:actor.agencyId!}}),
      prisma.user.findMany({where:actor.role==='SYSTEM_ADMIN'?undefined:{agencyId:actor.agencyId!},select:{id:true,name:true,email:true,role:true,agencyId:true},orderBy:{createdAt:'asc'}}),
    ]);
    return NextResponse.json({data:{mode:'database',agency,users}});
  }catch(error){
    console.error('Failed to load settings',error);
    return NextResponse.json({error:apiAccessMessage(error,'خطا در دریافت تنظیمات')},{status:apiAccessStatus(error)});
  }
}

export async function PATCH(request:Request){
  try{
    const body=await request.json();
    if(body.type==='agency'){
      const session=await requireApiPermission('MANAGE_SETTINGS');
      const name=String(body.name??'').trim();
      if(!name)return NextResponse.json({error:'نام آژانس الزامی است'},{status:400});
      if(isDemoMode()){demoAgencyName=name;return NextResponse.json({data:{id:'demo',name}});}
      const actor=await getActor(session.user.id);
      if(actor.role!=='SYSTEM_ADMIN'){
        if(!actor.agencyId)throw new ApiAccessError(403,'کاربر به آژانسی متصل نیست');
        const agency=await prisma.agency.update({where:{id:actor.agencyId},data:{name}});
        return NextResponse.json({data:agency});
      }
      const current=await prisma.agency.findFirst({orderBy:{createdAt:'asc'}});
      const agency=current?await prisma.agency.update({where:{id:current.id},data:{name}}):await prisma.agency.create({data:{name}});
      return NextResponse.json({data:agency});
    }
    if(body.type==='user-role'){
      const session=await requireApiPermission('MANAGE_USERS');
      const id=String(body.id??'');
      const role=String(body.role??'') as AppRole;
      if(!['SYSTEM_ADMIN','AGENCY_MANAGER','AGENT'].includes(role))return NextResponse.json({error:'نقش نامعتبر است'},{status:400});
      if(isDemoMode()){
        const user=demoUsers.find(x=>x.id===id);if(!user)return NextResponse.json({error:'کاربر پیدا نشد'},{status:404});
        if(session.user.role!=='SYSTEM_ADMIN'&&role==='SYSTEM_ADMIN')throw new ApiAccessError(403,'فقط مدیر سیستم می‌تواند مدیر سیستم تعیین کند');
        user.role=role;return NextResponse.json({data:user});
      }
      const actor=await getActor(session.user.id);
      const target=await prisma.user.findUnique({where:{id},select:{id:true,role:true,agencyId:true}});
      if(!target)return NextResponse.json({error:'کاربر پیدا نشد'},{status:404});
      if(actor.role!=='SYSTEM_ADMIN'){
        if(!actor.agencyId||target.agencyId!==actor.agencyId)throw new ApiAccessError(403,'امکان مدیریت کاربر آژانس دیگر وجود ندارد');
        if(role==='SYSTEM_ADMIN'||target.role==='SYSTEM_ADMIN')throw new ApiAccessError(403,'فقط مدیر سیستم می‌تواند نقش مدیر سیستم را تغییر دهد');
      }
      if(actor.id===target.id&&target.role==='SYSTEM_ADMIN'&&role!=='SYSTEM_ADMIN')throw new ApiAccessError(403,'مدیر سیستم نمی‌تواند نقش خودش را کاهش دهد');
      if(target.role==='SYSTEM_ADMIN'&&role!=='SYSTEM_ADMIN'){
        const systemAdminCount=await prisma.user.count({where:{role:'SYSTEM_ADMIN'}});
        if(systemAdminCount<=1)throw new ApiAccessError(403,'حداقل یک مدیر سیستم باید باقی بماند');
      }
      const user=await prisma.user.update({where:{id},data:{role},select:{id:true,name:true,email:true,role:true,agencyId:true}});
      return NextResponse.json({data:user});
    }
    return NextResponse.json({error:'درخواست نامعتبر است'},{status:400});
  }catch(error){
    console.error('Failed to update settings',error);
    return NextResponse.json({error:apiAccessMessage(error,'خطا در ذخیره تنظیمات')},{status:apiAccessStatus(error)});
  }
}
