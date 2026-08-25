import { NextResponse } from 'next/server';
import { createApplicant, listApplicants } from '@/lib/repositories/applicant-repository';
import { requireUser } from '@/lib/authz';
import { apiError, finiteNumber, optionalId, optionalText, stringArray, text } from '@/lib/api-validation';

export async function GET() {
  try { return NextResponse.json(await listApplicants(await requireUser())); }
  catch (error) { const out = apiError(error, 'خطا در دریافت متقاضی‌ها'); return NextResponse.json({ error: out.message }, { status: out.status }); }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const applicant = await createApplicant({
      name: text(body.name, 'نام', 120), phone: text(body.phone, 'شماره تماس', 30), requestType: text(body.requestType, 'نوع درخواست', 50),
      budgetMin: body.budgetMin == null || body.budgetMin === '' ? undefined : finiteNumber(body.budgetMin, 'حداقل بودجه'),
      budgetMax: body.budgetMax == null || body.budgetMax === '' ? undefined : finiteNumber(body.budgetMax, 'حداکثر بودجه'),
      cities: stringArray(body.cities), districts: stringArray(body.districts), propertyTypes: stringArray(body.propertyTypes),
      minRooms: body.minRooms == null || body.minRooms === '' ? undefined : finiteNumber(body.minRooms, 'حداقل اتاق', 0, 100),
      requiredFeatures: stringArray(body.requiredFeatures), urgency: finiteNumber(body.urgency ?? 1, 'فوریت', 1, 4),
      notes: optionalText(body.notes, 2000), agentId: optionalId(body.agentId), status: optionalText(body.status, 50),
    }, user);
    return NextResponse.json(applicant, { status: 201 });
  } catch (error) { const out = apiError(error, 'خطا در ثبت متقاضی'); return NextResponse.json({ error: out.message }, { status: out.status }); }
}
