import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import { getApplicantTimeline } from '@/lib/repositories/activity-repository';
import { apiError } from '@/lib/api-validation';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try { return NextResponse.json({ data: await getApplicantTimeline(params.id, await requireUser()) }); }
  catch (error) { const out = apiError(error, 'دریافت تاریخچه Pipeline انجام نشد.'); return NextResponse.json({ error: out.message }, { status: out.status }); }
}
