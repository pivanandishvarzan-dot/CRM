import { NextResponse } from 'next/server';
import { pipelineStages, updateApplicantStatus } from '@/lib/repositories/applicant-repository';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    if (!pipelineStages.includes(body.status)) {
      return NextResponse.json({ error: 'مرحله Pipeline نامعتبر است.' }, { status: 400 });
    }
    const result = await updateApplicantStatus(params.id, body.status);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'به‌روزرسانی Pipeline انجام نشد.' }, { status: 500 });
  }
}
