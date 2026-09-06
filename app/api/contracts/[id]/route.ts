import {NextResponse} from 'next/server';
import {deleteContract} from '@/lib/repositories/contracts';
import {apiAccessMessage,apiAccessStatus,ApiAccessError,requireApiPermission} from '@/lib/api-access';
import {prisma} from '@/lib/prisma';

export async function DELETE(_:Request,{params}:{params:{id:string}}){
 try{
  const session=await requireApiPermission('MANAGE_CONTRACTS');
  let agencyId:string|undefined;
  if(session.user.role!=='SYSTEM_ADMIN'){
   const actor=await prisma.user.findUnique({where:{id:session.user.id},select:{agencyId:true}});
   if(!actor?.agencyId)throw new ApiAccessError(403,'کاربر به آژانسی متصل نیست');
   agencyId=actor.agencyId;
  }
  await deleteContract(params.id,agencyId);
  return new NextResponse(null,{status:204});
 }catch(e){
  console.error(e);
  if(e instanceof Error&&e.message==='FORBIDDEN_OR_NOT_FOUND')return NextResponse.json({error:'قرارداد یافت نشد'},{status:404});
  return NextResponse.json({error:apiAccessMessage(e,'حذف قرارداد ممکن نیست')},{status:apiAccessStatus(e,409)});
 }
}
