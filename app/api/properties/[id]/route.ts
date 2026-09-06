import {NextResponse} from 'next/server';
import {deleteProperty,getProperty} from '@/lib/repositories/properties';
import {apiAccessStatus,requireAnyApiPermission} from '@/lib/api-access';

async function propertyAccess(){
  const session=await requireAnyApiPermission(['MANAGE_OWN_PROPERTIES','MANAGE_ALL_PROPERTIES']);
  const role=session.user.role;
  return {agentId:role==='AGENT'?session.user.id:undefined};
}

export async function GET(_request:Request,{params}:{params:{id:string}}){
  try{
    const {agentId}=await propertyAccess();
    const property=await getProperty(params.id,agentId);
    if(!property)return NextResponse.json({error:'ملک پیدا نشد'},{status:404});
    return NextResponse.json({data:property});
  }catch(error){
    console.error('Failed to get property',error);
    const status=apiAccessStatus(error);
    return NextResponse.json({error:status===401?'نیاز به ورود دارید':status===403?'دسترسی غیرمجاز':'خطا در دریافت ملک'},{status});
  }
}

export async function DELETE(_request:Request,{params}:{params:{id:string}}){
  try{
    const {agentId}=await propertyAccess();
    await deleteProperty(params.id,agentId);
    return NextResponse.json({ok:true});
  }catch(error){
    console.error('Failed to delete property',error);
    if(error instanceof Error&&error.message==='FORBIDDEN_OR_NOT_FOUND')return NextResponse.json({error:'ملک پیدا نشد یا اجازه حذف آن را ندارید'},{status:404});
    const status=apiAccessStatus(error);
    return NextResponse.json({error:status===401?'نیاز به ورود دارید':status===403?'دسترسی غیرمجاز':'خطا در حذف ملک'},{status});
  }
}
