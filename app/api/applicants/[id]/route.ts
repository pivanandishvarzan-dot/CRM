import { NextResponse } from 'next/server';
import { deleteApplicant } from '@/lib/repositories/contacts';
import { apiAccessMessage, apiAccessStatus, requireAnyApiPermission } from '@/lib/api-access';

export async function DELETE(_:Request,{params}:{params:{id:string}}){
 try{
  const session=await requireAnyApiPermission(['MANAGE_OWN_PROPERTIES','MANAGE_ALL_PROPERTIES']);
  const agentId=session.user.role==='AGENT'?session.user.id:undefined;
  await deleteApplicant(params.id,agentId);
  return new NextResponse(null,{status:204});
 }catch(e){
  console.error(e);
  if(e instanceof Error&&e.message==='FORBIDDEN_OR_NOT_FOUND')return NextResponse.json({error:'متقاضی یافت نشد'},{status:404});
  const status=apiAccessStatus(e,409);
  return NextResponse.json({error:apiAccessMessage(e,'متقاضی دارای ارتباطات ثبت‌شده است یا حذف ممکن نیست')},{status});
 }
}
