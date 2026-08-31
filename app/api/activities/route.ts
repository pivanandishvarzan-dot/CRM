import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import { getActivityActors, getRecentActivities } from '@/lib/repositories/activity-repository';
import { apiError } from '@/lib/api-validation';

export async function GET(request: Request) {
  try {
    const actor = await requireUser();
    const url = new URL(request.url);
    const take = Number(url.searchParams.get('take') || 100);
    const options = {
      action: url.searchParams.get('action') || undefined,
      entityType: url.searchParams.get('entityType') || undefined,
      actorId: url.searchParams.get('actorId') || undefined,
      query: url.searchParams.get('q') || undefined,
    };
    const [data, actors] = await Promise.all([getRecentActivities(actor, Number.isFinite(take) ? take : 100, options), getActivityActors(actor)]);
    return NextResponse.json({ data, actors });
  } catch (error) {
    const out = apiError(error, 'دریافت گزارش فعالیت‌ها انجام نشد.');
    return NextResponse.json({ error: out.message }, { status: out.status });
  }
}
