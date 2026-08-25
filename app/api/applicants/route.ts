import { NextResponse } from 'next/server';
import { createApplicant, listApplicants } from '@/lib/repositories/applicant-repository';
import { requireUser } from '@/lib/authz';

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await listApplicants(user));
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'نیاز به ورود دارید.' }, { status: 401 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطا در دریافت متقاضی‌ها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    if (!body.name || !body.phone || !body.requestType) return NextResponse.json({ error: 'نام، شماره تماس و نوع درخواست الزامی هستند.' }, { status: 400 });
    return NextResponse.json(await createApplicant(body, user), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'نیاز به ورود دارید.' }, { status: 401 });
    if (error instanceof Error && error.message === 'FORBIDDEN') return NextResponse.json({ error: 'دسترسی مجاز نیست.' }, { status: 403 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطا در ثبت متقاضی' }, { status: 500 });
  }
}
