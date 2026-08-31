import { NextResponse } from 'next/server';
import { createFollowup, listFollowups } from '@/lib/repositories/followup-repository';
import { requireUser } from '@/lib/authz';
import { apiError, dateTime, finiteNumber, optionalId, optionalText, text } from '@/lib/api-validation';

export async function GET() {
  try { return NextResponse.json(await listFollowups(await requireUser())); }
  catch (error) { const out = apiError(error, 'خطا در دریافت پیگیری‌ها'); return NextResponse.json({ error: out.message }, { status: out.status }); }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const followup = await createFollowup({
      title: text(body.title, 'عنوان', 200), type: text(body.type, 'نوع پیگیری', 50), scheduledAt: dateTime(body.scheduledAt, 'زمان پیگیری'),
      priority: finiteNumber(body.priority ?? 2, 'اولویت', 1, 4), completed: Boolean(body.completed), description: optionalText(body.description, 2000),
      assigneeId: optionalId(body.assigneeId), ownerId: optionalId(body.ownerId), applicantId: optionalId(body.applicantId), propertyId: optionalId(body.propertyId),
    }, user);
    return NextResponse.json(followup, { status: 201 });
  } catch (error) { const out = apiError(error, 'ثبت پیگیری انجام نشد'); return NextResponse.json({ error: out.message }, { status: out.status }); }
}
