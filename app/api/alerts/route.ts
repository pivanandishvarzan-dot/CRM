import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import { refreshSmartAlerts } from '@/lib/repositories/alert-repository';
import { apiError } from '@/lib/api-validation';
export async function GET(){try{return NextResponse.json({data:await refreshSmartAlerts(await requireUser())});}catch(error){const out=apiError(error,'دریافت اعلان‌ها انجام نشد.');return NextResponse.json({error:out.message},{status:out.status});}}
