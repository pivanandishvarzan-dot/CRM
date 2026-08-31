import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { apiError } from '@/lib/api-validation';
import { listAutomationJobs, retryAutomationJob } from '@/lib/repositories/job-repository';

export async function GET(request: Request) {
  try {
    const user = await requireRole(['AGENCY_MANAGER']);
    const status = new URL(request.url).searchParams.get('status') || undefined;
    return NextResponse.json({ data: await listAutomationJobs(user, status) });
  } catch (error) {
    const out = apiError(error, 'دریافت Jobها انجام نشد.');
    return NextResponse.json({ error: out.message }, { status: out.status });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(['AGENCY_MANAGER']);
    const body = await request.json();
    if (!body?.id || body?.action !== 'retry') return NextResponse.json({ error: 'درخواست نامعتبر است.' }, { status: 400 });
    return NextResponse.json({ data: await retryAutomationJob(String(body.id), user) });
  } catch (error) {
    const out = apiError(error, 'Retry Job انجام نشد.');
    return NextResponse.json({ error: out.message }, { status: out.status });
  }
}
