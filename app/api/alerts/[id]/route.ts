import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import { markAlertRead } from '@/lib/repositories/alert-repository';
import { apiError } from '@/lib/api-validation';
export async function PATCH(_:Request,{params}:{params:{id:string}}){try{return NextResponse.json({data:await markAlertRead(params.id,await requireUser())});}catch(error){const out=apiError(error,'به‌روزرسانی اعلان انجام نشد.');return NextResponse.json({error:out.message},{status:out.status});}}
