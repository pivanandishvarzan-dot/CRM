import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import { getProperty } from '@/lib/repositories/property-repository';
import { createUploadUrl, internalFileUrl, makeStorageKey, storageConfigured, validateStorageFile } from '@/lib/storage';

export async function POST(request:Request){
  try{
    const actor=await requireUser();
    const body=await request.json();
    const propertyId=String(body.propertyId||'');
    const kind=body.kind==='document'?'document':'image';
    const name=String(body.name||'file');
    const type=String(body.type||'');
    const size=Number(body.size||0);
    const property=await getProperty(propertyId,actor);
    if(!property)return NextResponse.json({error:'ملک پیدا نشد یا دسترسی ندارید.'},{status:404});
    if(!storageConfigured)return NextResponse.json({error:'Storage هنوز برای این محیط تنظیم نشده است.'},{status:503});
    validateStorageFile(kind,type,size);
    const key=makeStorageKey(propertyId,kind,name);
    const uploadUrl=await createUploadUrl(key,type);
    return NextResponse.json({uploadUrl,fileUrl:internalFileUrl(key),key,expiresIn:600});
  }catch(e){
    const message=e instanceof Error?e.message:'خطا';
    if(message==='UNSUPPORTED_FILE_TYPE')return NextResponse.json({error:'فرمت فایل مجاز نیست.'},{status:400});
    if(message==='FILE_TOO_LARGE')return NextResponse.json({error:'حجم فایل بیش از حد مجاز است.'},{status:400});
    return NextResponse.json({error:'ساخت لینک آپلود انجام نشد.'},{status:500});
  }
}
