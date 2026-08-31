import { NextResponse } from 'next/server';
import { setFollowupCompleted } from '@/lib/repositories/followup-repository';
import { requireUser } from '@/lib/authz';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await request.json();
    if (typeof body.completed !== 'boolean') return NextResponse.json({ error: 'completed باید مقدار boolean باشد.' }, { status: 400 });
    return NextResponse.json(await setFollowupCompleted(params.id, body.completed, user));
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'نیاز به ورود دارید.' }, { status: 401 });
    if (error instanceof Error && error.message === 'NOT_FOUND') return NextResponse.json({ error: 'پیگیری پیدا نشد یا دسترسی ندارید.' }, { status: 404 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'به‌روزرسانی پیگیری انجام نشد' }, { status: 500 });
  }
}
