import {NextResponse} from 'next/server';
import {deleteFollowup,setFollowupCompleted} from '@/lib/repositories/followups';
import {apiAccessStatus,requireAnyApiPermission} from '@/lib/api-access';

async function followupAccess(){
  const session=await requireAnyApiPermission(['MANAGE_OWN_FOLLOWUPS','MANAGE_ALL_FOLLOWUPS']);
  return {assigneeId:session.user.role==='AGENT'?session.user.id:undefined};
}

export async function PATCH(req:Request,{params}:{params:{id:string}}){
  try{
    const {assigneeId}=await followupAccess();
    const body=await req.json();
    if(typeof body.completed!=='boolean')return NextResponse.json({error:'وضعیت نامعتبر است'},{status:400});
    const data=await setFollowupCompleted(params.id,body.completed,assigneeId);
    if(!data)return NextResponse.json({error:'پیگیری پیدا نشد'},{status:404});
    return NextResponse.json({data});
  }catch(error){
    console.error('Failed to update followup',error);
    if(error instanceof Error&&error.message==='FORBIDDEN_OR_NOT_FOUND')return NextResponse.json({error:'پیگیری پیدا نشد یا اجازه تغییر آن را ندارید'},{status:404});
    const status=apiAccessStatus(error);
    return NextResponse.json({error:status===401?'نیاز به ورود دارید':status===403?'دسترسی غیرمجاز':'خطا در بروزرسانی پیگیری'},{status});
  }
}

export async function DELETE(_req:Request,{params}:{params:{id:string}}){
  try{
    const {assigneeId}=await followupAccess();
    await deleteFollowup(params.id,assigneeId);
    return new NextResponse(null,{status:204});
  }catch(error){
    console.error('Failed to delete followup',error);
    if(error instanceof Error&&error.message==='FORBIDDEN_OR_NOT_FOUND')return NextResponse.json({error:'پیگیری پیدا نشد یا اجازه حذف آن را ندارید'},{status:404});
    const status=apiAccessStatus(error);
    return NextResponse.json({error:status===401?'نیاز به ورود دارید':status===403?'دسترسی غیرمجاز':'خطا در حذف پیگیری'},{status});
  }
}
