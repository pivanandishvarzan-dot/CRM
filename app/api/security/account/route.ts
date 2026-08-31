import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import { prisma, isDemoMode } from '@/lib/prisma';
import { apiError } from '@/lib/api-validation';

export async function GET(request:Request){
  try{
    const actor=await requireUser();
    if(isDemoMode)return NextResponse.json({data:[],users:[]});
    const url=new URL(request.url);const requested=url.searchParams.get('userId');let userId=actor.id;
    if(requested&&actor.role!=='AGENT'){
      const target=await prisma.user.findFirst({where:{id:requested,...(actor.role==='AGENCY_MANAGER'?{agencyId:actor.agencyId??'__none__'}:{})},select:{id:true}});
      if(target)userId=target.id;
    }
    const [data,users]=await Promise.all([
      prisma.loginEvent.findMany({where:{userId},orderBy:{createdAt:'desc'},take:100}),
      actor.role==='AGENT'?Promise.resolve([]):prisma.user.findMany({where:actor.role==='SYSTEM_ADMIN'?{}:{agencyId:actor.agencyId??'__none__'},select:{id:true,name:true,email:true},orderBy:{name:'asc'}}),
    ]);
    return NextResponse.json({data,users,currentUserId:actor.id});
  }catch(e){const out=apiError(e,'دریافت اطلاعات امنیتی انجام نشد.');return NextResponse.json({error:out.message},{status:out.status})}
}

export async function POST(request:Request){
  try{
    const actor=await requireUser();
    if(isDemoMode)return NextResponse.json({ok:true});
    const body=await request.json().catch(()=>({}));let userId=actor.id;
    if(body.userId&&body.userId!==actor.id){
      if(actor.role==='AGENT')return NextResponse.json({error:'دسترسی مجاز نیست.'},{status:403});
      const target=await prisma.user.findFirst({where:{id:String(body.userId),...(actor.role==='AGENCY_MANAGER'?{agencyId:actor.agencyId??'__none__'}:{})},select:{id:true}});
      if(!target)return NextResponse.json({error:'کاربر پیدا نشد.'},{status:404});userId=target.id;
    }
    await prisma.user.update({where:{id:userId},data:{sessionVersion:{increment:1}}});
    await prisma.loginEvent.create({data:{userId,email:actor.email||'',success:true,reason:userId===actor.id?'SESSIONS_REVOKED_SELF':'SESSIONS_REVOKED_BY_MANAGER'}});
    return NextResponse.json({ok:true,userId});
  }catch(e){const out=apiError(e,'خروج از دستگاه‌ها انجام نشد.');return NextResponse.json({error:out.message},{status:out.status})}
}
