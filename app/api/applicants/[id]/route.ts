import { NextResponse } from 'next/server';
import { getApplicant, pipelineStages, updateApplicantStatus } from '@/lib/repositories/applicant-repository';
import { requireUser } from '@/lib/authz';
import { apiError } from '@/lib/api-validation';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const applicant = await getApplicant(params.id, await requireUser());
    if (!applicant) return NextResponse.json({ error: 'متقاضی پیدا نشد یا دسترسی ندارید.' }, { status: 404 });
    return NextResponse.json({ data: applicant });
  } catch (error) {
    const out = apiError(error, 'دریافت پرونده متقاضی انجام نشد.');
    return NextResponse.json({ error: out.message }, { status: out.status });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await request.json();
    if (!pipelineStages.includes(body.status)) return NextResponse.json({ error: 'مرحله Pipeline نامعتبر است.' }, { status: 400 });
    return NextResponse.json(await updateApplicantStatus(params.id, body.status, user));
  } catch (error) {
    const out = apiError(error, 'به‌روزرسانی Pipeline انجام نشد.');
    return NextResponse.json({ error: out.message }, { status: out.status });
  }
}
