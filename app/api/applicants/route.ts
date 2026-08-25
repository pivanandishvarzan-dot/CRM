import { NextResponse } from 'next/server';
import { createApplicant, listApplicants } from '@/lib/repositories/applicant-repository';

export async function GET() {
  try {
    return NextResponse.json(await listApplicants());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطا در دریافت متقاضی‌ها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.phone || !body.requestType) {
      return NextResponse.json({ error: 'نام، شماره تماس و نوع درخواست الزامی هستند.' }, { status: 400 });
    }
    return NextResponse.json(await createApplicant(body), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطا در ثبت متقاضی' }, { status: 500 });
  }
}
