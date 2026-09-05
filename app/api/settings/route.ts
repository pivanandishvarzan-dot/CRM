import {NextResponse} from 'next/server';
import {isDemoMode} from '@/lib/data-mode';
import {prisma} from '@/lib/prisma';
import {requireApiPermission} from '@/lib/api-access';

const demoUsers=[
  {id:'demo-manager',name:'مدیر آژانس',email:'manager@demo.local',role:'AGENCY_MANAGER'},
  {id:'demo-agent-1',name:'علی رضایی',email:'ali@demo.local',role:'AGENT'},
  {id:'demo-agent-2',name:'سارا محمدی',email:'sara@demo.local',role:'AGENT'},
];
let demoAgencyName='آژانس املاک خانه‌یار';

export const dynamic='force-dynamic';

export async function GET(){
  try{
    if(!isDemoMode()) await requireApiPermission('MANAGE_SETTINGS');
    if(isDemoMode()) return NextResponse.json({data:{mode:'demo',agency:{id:'demo',name:demoAgencyName},users:demoUsers}});
    const [agency,users]=await Promise.all([
      prisma.agency.findFirst({orderBy:{createdAt:'asc'}}),
      prisma.user.findMany({select:{id:true,name:true,email:true,role:true,agencyId:true},orderBy:{createdAt:'asc'}}),
    ]);
    return NextResponse.json({data:{mode:'database',agency,users}});
  }catch(error){
    console.error('Failed to load settings',error);
    const status=error instanceof Error&&error.message==='UNAUTHORIZED'?401:error instanceof Error&&error.message==='FORBIDDEN'?403:500;
    return NextResponse.json({error:status===401?'نیاز به ورود دارید':status===403?'دسترسی غیرمجاز':'خطا در دریافت تنظیمات'},{status});
  }
}

export async function PATCH(request:Request){
  try{
    const body=await request.json();
    if(body.type==='agency'){
      if(!isDemoMode()) await requireApiPermission('MANAGE_SETTINGS');
      const name=String(body.name??'').trim();
      if(!name)return NextResponse.json({error:'نام آژانس الزامی است'},{status:400});
      if(isDemoMode()){demoAgencyName=name;return NextResponse.json({data:{id:'demo',name}});}
      const current=await prisma.agency.findFirst({orderBy:{createdAt:'asc'}});
      const agency=current?await prisma.agency.update({where:{id:current.id},data:{name}}):await prisma.agency.create({data:{name}});
      return NextResponse.json({data:agency});
    }
    if(body.type==='user-role'){
      if(!isDemoMode()) await requireApiPermission('MANAGE_USERS');
      const id=String(body.id??'');
      const role=String(body.role??'');
      if(!['SYSTEM_ADMIN','AGENCY_MANAGER','AGENT'].includes(role))return NextResponse.json({error:'نقش نامعتبر است'},{status:400});
      if(isDemoMode()){
        const user=demoUsers.find(x=>x.id===id);if(!user)return NextResponse.json({error:'کاربر پیدا نشد'},{status:404});
        user.role=role;return NextResponse.json({data:user});
      }
      const user=await prisma.user.update({where:{id},data:{role:role as 'SYSTEM_ADMIN'|'AGENCY_MANAGER'|'AGENT'},select:{id:true,name:true,email:true,role:true}});
      return NextResponse.json({data:user});
    }
    return NextResponse.json({error:'درخواست نامعتبر است'},{status:400});
  }catch(error){
    console.error('Failed to update settings',error);
    const status=error instanceof Error&&error.message==='UNAUTHORIZED'?401:error instanceof Error&&error.message==='FORBIDDEN'?403:500;
    return NextResponse.json({error:status===401?'نیاز به ورود دارید':status===403?'دسترسی غیرمجاز':'خطا در ذخیره تنظیمات'},{status});
  }
}
