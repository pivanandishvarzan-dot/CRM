import { NextResponse } from 'next/server';
import { deleteOwner } from '@/lib/repositories/contacts';
import { apiAccessMessage, apiAccessStatus, ApiAccessError, requireAnyApiPermission } from '@/lib/api-access';
import {isDemoMode} from '@/lib/data-mode';
import {prisma} from '@/lib/prisma';

export async function DELETE(_:Request,{params}:{params:{id:string}}){
 try{
  const session=await requireAnyApiPermission(['MANAGE_OWN_PROPERTIES','MANAGE_ALL_PROPERTIES']);
  let scope:{}|{agencyId:string}={};
  if(!isDemoMode()){
   const actor=await prisma.user.findUnique({where:{id:session.user.id},select:{role:true,agencyId:true}});
   if(!actor)throw new ApiAccessError(401,'کاربر معتبر نیست');
   if(actor.role!=='SYSTEM_ADMIN'){
    if(!actor.agencyId)throw new ApiAccessError(403,'کاربر به آژانسی متصل نیست');
    scope={agencyId:actor.agencyId};
   }
  }
  await deleteOwner(params.id,scope);
  return new NextResponse(null,{status:204});
 }catch(e){
  console.error(e);
  if(e instanceof Error&&e.message==='FORBIDDEN_OR_NOT_FOUND')return NextResponse.json({error:'مالک یافت نشد'},{status:404});
  return NextResponse.json({error:apiAccessMessage(e,'مالک دارای ارتباطات ثبت‌شده است یا حذف ممکن نیست')},{status:apiAccessStatus(e,409)});
 }
}
