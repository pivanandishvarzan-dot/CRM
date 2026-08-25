import { NextResponse } from 'next/server';
import { pipelineStages, updateApplicantStatus } from '@/lib/repositories/applicant-repository';
import { requireUser } from '@/lib/authz';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await request.json();
    if (!pipelineStages.includes(body.status)) return NextResponse.json({ error: 'مرحله Pipeline نامعتبر است.' }, { status: 400 });
    const result = await updateApplicantStatus(params.id, body.status, user);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'نیاز به ورود دارید.' }, { status: 401 });
    if (error instanceof Error && error.message === 'NOT_FOUND') return NextResponse.json({ error: 'متقاضی پیدا نشد یا دسترسی ندارید.' }, { status: 404 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'به‌روزرسانی Pipeline انجام نشد.' }, { status: 500 });
  }
}
