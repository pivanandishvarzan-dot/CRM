import { NextResponse } from 'next/server';
import { createContract, listContracts } from '@/lib/repositories/contract-repository';
import { requireUser } from '@/lib/authz';
import { apiError, dateTime, finiteNumber, optionalId, optionalText, text } from '@/lib/api-validation';

export async function GET() {
  try { return NextResponse.json(await listContracts(await requireUser())); }
  catch (error) { const out = apiError(error, 'خطا در دریافت قراردادها'); return NextResponse.json({ error: out.message }, { status: out.status }); }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const contract = await createContract({
      number: optionalText(body.number, 100), type: text(body.type, 'نوع قرارداد', 80), amount: finiteNumber(body.amount, 'مبلغ قرارداد'),
      commission: finiteNumber(body.commission, 'کمیسیون'), contractDate: dateTime(body.contractDate, 'تاریخ قرارداد'), status: optionalText(body.status, 50),
      notes: optionalText(body.notes, 2000), propertyId: optionalId(body.propertyId), applicantId: optionalId(body.applicantId), agentId: optionalId(body.agentId),
    }, user);
    return NextResponse.json(contract, { status: 201 });
  } catch (error) { const out = apiError(error, 'خطا در ثبت قرارداد'); return NextResponse.json({ error: out.message }, { status: out.status }); }
}
