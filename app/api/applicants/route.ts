import { NextResponse } from 'next/server';
import { createApplicant, listApplicants } from '@/lib/repositories/contacts';
import { apiAccessMessage, apiAccessStatus, requireAnyApiPermission } from '@/lib/api-access';

export const dynamic='force-dynamic';

async function applicantAccess(){
 const session=await requireAnyApiPermission(['MANAGE_OWN_PROPERTIES','MANAGE_ALL_PROPERTIES']);
 return session.user.role==='AGENT'?session.user.id:undefined;
}

export async function GET(){
 try{const agentId=await applicantAccess();return NextResponse.json({data:await listApplicants(agentId)});}
 catch(e){console.error(e);return NextResponse.json({error:apiAccessMessage(e,'خطا در دریافت متقاضی‌ها')},{status:apiAccessStatus(e)});}
}

export async function POST(req:Request){
 try{const agentId=await applicantAccess();const b=await req.json();if(!b.name||!b.phone||!b.requestType)return NextResponse.json({error:'اطلاعات ضروری ناقص است'},{status:400});return NextResponse.json({data:await createApplicant({...b,agentId:agentId??b.agentId})},{status:201});}
 catch(e){console.error(e);return NextResponse.json({error:apiAccessMessage(e,'خطا در ثبت متقاضی')},{status:apiAccessStatus(e)});}
}
