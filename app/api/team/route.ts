import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { apiError, text } from '@/lib/api-validation';
import { createTeamUser, listTeam, updateTeamUser } from '@/lib/repositories/team-repository';

export async function GET() {
  try { return NextResponse.json({ data: await listTeam(await requireRole(['SYSTEM_ADMIN','AGENCY_MANAGER'])) }); }
  catch (error) { const out = apiError(error, 'دریافت اعضای تیم انجام نشد.'); return NextResponse.json({ error: out.message }, { status: out.status }); }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole(['SYSTEM_ADMIN','AGENCY_MANAGER']);
    const body = await request.json();
    const role = body.role === 'AGENCY_MANAGER' ? 'AGENCY_MANAGER' : 'AGENT';
    const data = await createTeamUser({ name: text(body.name,'نام',100), email: text(body.email,'ایمیل',160), password: text(body.password,'رمز عبور',200), role }, actor);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'PASSWORD_TOO_SHORT') return NextResponse.json({ error: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' }, { status: 400 });
    const out = apiError(error, 'ساخت کاربر انجام نشد.'); return NextResponse.json({ error: out.message }, { status: out.status });
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireRole(['SYSTEM_ADMIN','AGENCY_MANAGER']);
    const body = await request.json();
    const data = await updateTeamUser(String(body.id || ''), { active: body.active === undefined ? undefined : Boolean(body.active), role: body.role === undefined ? undefined : (body.role === 'AGENCY_MANAGER' ? 'AGENCY_MANAGER' : 'AGENT'), password: body.password ? String(body.password) : undefined }, actor);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === 'PASSWORD_TOO_SHORT') return NextResponse.json({ error: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' }, { status: 400 });
    if (error instanceof Error && error.message === 'CANNOT_DISABLE_SELF') return NextResponse.json({ error: 'نمی‌توانید حساب خودتان را غیرفعال کنید.' }, { status: 400 });
    const out = apiError(error, 'به‌روزرسانی کاربر انجام نشد.'); return NextResponse.json({ error: out.message }, { status: out.status });
  }
}
