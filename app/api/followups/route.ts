import { NextResponse } from 'next/server';
import { createFollowup, listFollowups } from '@/lib/repositories/followup-repository';
import { requireUser } from '@/lib/authz';

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await listFollowups(user));
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'نیاز به ورود دارید.' }, { status: 401 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطا در دریافت پیگیری‌ها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    if (!body.title || !body.type || !body.scheduledAt) return NextResponse.json({ error: 'عنوان، نوع و زمان پیگیری الزامی است.' }, { status: 400 });
    return NextResponse.json(await createFollowup(body, user), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'نیاز به ورود دارید.' }, { status: 401 });
    if (error instanceof Error && error.message === 'FORBIDDEN') return NextResponse.json({ error: 'دسترسی مجاز نیست.' }, { status: 403 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'ثبت پیگیری انجام نشد' }, { status: 500 });
  }
}
