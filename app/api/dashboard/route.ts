import { NextResponse } from 'next/server';
import { getDashboardAnalytics } from '@/lib/repositories/dashboard-repository';
import { requireUser } from '@/lib/authz';

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await getDashboardAnalytics(user));
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'نیاز به ورود دارید.' }, { status: 401 });
    console.error('dashboard analytics error', error);
    return NextResponse.json({ error: 'دریافت اطلاعات داشبورد انجام نشد.' }, { status: 500 });
  }
}
