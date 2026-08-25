import { NextResponse } from 'next/server';
import { createFollowup, listFollowups } from '@/lib/repositories/followup-repository';

export async function GET() {
  try {
    return NextResponse.json(await listFollowups());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطا در دریافت پیگیری‌ها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.type || !body.scheduledAt) {
      return NextResponse.json({ error: 'عنوان، نوع و زمان پیگیری الزامی است.' }, { status: 400 });
    }
    return NextResponse.json(await createFollowup(body), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'ثبت پیگیری انجام نشد' }, { status: 500 });
  }
}
