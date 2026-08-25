import { NextResponse } from 'next/server';
import { getDashboardAnalytics } from '@/lib/repositories/dashboard-repository';

export async function GET() {
  try {
    return NextResponse.json(await getDashboardAnalytics());
  } catch (error) {
    console.error('dashboard analytics error', error);
    return NextResponse.json({ error: 'دریافت اطلاعات داشبورد انجام نشد.' }, { status: 500 });
  }
}
