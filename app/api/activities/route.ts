import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import { getRecentActivities } from '@/lib/repositories/activity-repository';
import { apiError } from '@/lib/api-validation';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const take = Number(url.searchParams.get('take') || 50);
    return NextResponse.json({ data: await getRecentActivities(await requireUser(), Number.isFinite(take) ? take : 50) });
  } catch (error) {
    const out = apiError(error, 'دریافت گزارش فعالیت‌ها انجام نشد.');
    return NextResponse.json({ error: out.message }, { status: out.status });
  }
}
