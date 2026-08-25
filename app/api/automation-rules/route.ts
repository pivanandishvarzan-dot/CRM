import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { ensureAutomationRules, updateAutomationRule } from '@/lib/repositories/automation-repository';
import { apiError } from '@/lib/api-validation';

export async function GET() {
  try { return NextResponse.json({data: await ensureAutomationRules(await requireRole(['AGENCY_MANAGER']))}); }
  catch(error){ const out=apiError(error,'دریافت قوانین اتوماسیون انجام نشد.'); return NextResponse.json({error:out.message},{status:out.status}); }
}

export async function PATCH(request:Request){
  try{
    const user=await requireRole(['AGENCY_MANAGER']);
    const body=await request.json();
    if(!body?.id) return NextResponse.json({error:'شناسه Rule الزامی است.'},{status:400});
    if(body.action!==undefined&&!['ALERT','ALERT_AND_TASK'].includes(body.action)) return NextResponse.json({error:'Action نامعتبر است.'},{status:400});
    const data=await updateAutomationRule(String(body.id),{
      enabled:body.enabled===undefined?undefined:Boolean(body.enabled),
      thresholdDays:body.thresholdDays===undefined?undefined:Number(body.thresholdDays),
      action:body.action,
      priority:body.priority===undefined?undefined:Number(body.priority),
    },user);
    return NextResponse.json({data});
  }catch(error){const out=apiError(error,'ذخیره Rule انجام نشد.');return NextResponse.json({error:out.message},{status:out.status});}
}
