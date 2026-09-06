import { NextResponse } from 'next/server';
import { createOwner, listOwners } from '@/lib/repositories/contacts';
import { apiAccessMessage, apiAccessStatus, ApiAccessError, requireAnyApiPermission } from '@/lib/api-access';
import {isDemoMode} from '@/lib/data-mode';
import {prisma} from '@/lib/prisma';

export const dynamic='force-dynamic';

async function ownerAccess(){
 const session=await requireAnyApiPermission(['MANAGE_OWN_PROPERTIES','MANAGE_ALL_PROPERTIES']);
 if(isDemoMode())return {session,scope:{}};
 const actor=await prisma.user.findUnique({where:{id:session.user.id},select:{role:true,agencyId:true}});
 if(!actor)throw new ApiAccessError(401,'کاربر معتبر نیست');
 if(actor.role==='SYSTEM_ADMIN')return {session,scope:{}};
 if(!actor.agencyId)throw new ApiAccessError(403,'کاربر به آژانسی متصل نیست');
 return {session,scope:{agencyId:actor.agencyId}};
}

export async function GET(){
 try{const {scope}=await ownerAccess();return NextResponse.json({data:await listOwners(scope)});}
 catch(e){console.error(e);return NextResponse.json({error:apiAccessMessage(e,'خطا در دریافت مالک‌ها')},{status:apiAccessStatus(e)});}
}
export async function POST(req:Request){
 try{const {scope}=await ownerAccess();const b=await req.json();if(!b.name||!b.phone)return NextResponse.json({error:'نام و شماره تماس الزامی است'},{status:400});return NextResponse.json({data:await createOwner({...b,agencyId:scope.agencyId})},{status:201});}
 catch(e){console.error(e);return NextResponse.json({error:apiAccessMessage(e,'خطا در ثبت مالک')},{status:apiAccessStatus(e)});}
}
