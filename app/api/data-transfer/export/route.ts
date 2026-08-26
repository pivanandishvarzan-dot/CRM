import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import { exportWorkbook } from '@/lib/data-transfer';
import { apiError } from '@/lib/api-validation';

const allowed=['properties','owners','applicants'] as const;
export async function GET(request:Request){
  try{
    const actor=await requireUser();const url=new URL(request.url);const entity=url.searchParams.get('entity') as typeof allowed[number];
    if(!allowed.includes(entity))return NextResponse.json({error:'نوع خروجی نامعتبر است.'},{status:400});
    const file=await exportWorkbook(entity,actor);
    return new NextResponse(file,{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="crm-${entity}.xlsx"`}});
  }catch(error){const out=apiError(error,'ساخت خروجی Excel انجام نشد.');return NextResponse.json({error:out.message},{status:out.status})}
}
