import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import { importWorkbook } from '@/lib/data-transfer';
import { apiError } from '@/lib/api-validation';

const allowed=['properties','owners','applicants'] as const;
export async function POST(request:Request){
  try{
    const actor=await requireUser();const form=await request.formData();const entity=String(form.get('entity')||'') as typeof allowed[number];const file=form.get('file');
    if(!allowed.includes(entity))return NextResponse.json({error:'نوع Import نامعتبر است.'},{status:400});
    if(!(file instanceof File))return NextResponse.json({error:'فایل الزامی است.'},{status:400});
    if(file.size>10*1024*1024)return NextResponse.json({error:'حجم فایل نباید بیشتر از ۱۰ مگابایت باشد.'},{status:400});
    const lower=file.name.toLowerCase();if(!lower.endsWith('.xlsx')&&!lower.endsWith('.xls')&&!lower.endsWith('.csv'))return NextResponse.json({error:'فرمت فایل باید Excel یا CSV باشد.'},{status:400});
    return NextResponse.json({data:await importWorkbook(await file.arrayBuffer(),entity,actor)});
  }catch(error){const out=apiError(error,'Import اطلاعات انجام نشد.');return NextResponse.json({error:out.message},{status:out.status})}
}
