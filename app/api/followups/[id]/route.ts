import { NextResponse } from 'next/server';
import { setFollowupCompleted } from '@/lib/repositories/followup-repository';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    if (typeof body.completed !== 'boolean') {
      return NextResponse.json({ error: 'completed باید مقدار boolean باشد.' }, { status: 400 });
    }
    return NextResponse.json(await setFollowupCompleted(params.id, body.completed));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'به‌روزرسانی پیگیری انجام نشد' }, { status: 500 });
  }
}
