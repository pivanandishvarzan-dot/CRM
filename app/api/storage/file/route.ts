import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import { getProperty } from '@/lib/repositories/property-repository';
import { createDownloadUrl, deleteStorageObject } from '@/lib/storage';

function propertyIdFromKey(key:string){const parts=key.split('/');return parts[0]==='properties'&&parts[1]?parts[1]:null}

export async function GET(request:Request){
  try{
    const actor=await requireUser();
    const key=new URL(request.url).searchParams.get('key')||'';
    const propertyId=propertyIdFromKey(key);
    if(!propertyId)return NextResponse.json({error:'مسیر فایل معتبر نیست.'},{status:400});
    const property=await getProperty(propertyId,actor);
    if(!property)return NextResponse.json({error:'دسترسی به فایل مجاز نیست.'},{status:403});
    return NextResponse.redirect(await createDownloadUrl(key));
  }catch{return NextResponse.json({error:'دریافت فایل انجام نشد.'},{status:500})}
}

export async function DELETE(request:Request){
  try{
    const actor=await requireUser();
    const key=new URL(request.url).searchParams.get('key')||'';
    const propertyId=propertyIdFromKey(key);
    if(!propertyId)return NextResponse.json({error:'مسیر فایل معتبر نیست.'},{status:400});
    const property=await getProperty(propertyId,actor);
    if(!property)return NextResponse.json({error:'دسترسی به فایل مجاز نیست.'},{status:403});
    await deleteStorageObject(key);
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:'حذف فایل انجام نشد.'},{status:500})}
}
