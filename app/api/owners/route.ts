import { NextResponse } from 'next/server';
import { createOwner, listOwners } from '@/lib/repositories/contacts';
import { apiAccessMessage, apiAccessStatus, requireAnyApiPermission } from '@/lib/api-access';

export const dynamic='force-dynamic';

async function ownerAccess(){
 const session=await requireAnyApiPermission(['MANAGE_OWN_PROPERTIES','MANAGE_ALL_PROPERTIES']);
 return session.user.role==='AGENT'?session.user.id:undefined;
}

export async function GET(){
 try{const agentId=await ownerAccess();return NextResponse.json({data:await listOwners(agentId)});}
 catch(e){console.error(e);return NextResponse.json({error:apiAccessMessage(e,'خطا در دریافت مالک‌ها')},{status:apiAccessStatus(e)});}
}

export async function POST(req:Request){
 try{await ownerAccess();const b=await req.json();if(!b.name||!b.phone)return NextResponse.json({error:'نام و شماره تماس الزامی است'},{status:400});return NextResponse.json({data:await createOwner(b)},{status:201});}
 catch(e){console.error(e);return NextResponse.json({error:apiAccessMessage(e,'خطا در ثبت مالک')},{status:apiAccessStatus(e)});}
}
