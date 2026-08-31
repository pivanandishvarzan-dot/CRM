import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { getAdvancedReports } from '@/lib/repositories/reports-repository';
import { getPipelineHistoryMetrics } from '@/lib/repositories/activity-repository';
import { apiError } from '@/lib/api-validation';

function parseDate(value: string | null, end = false) {
  if (!value) return undefined;
  const date = new Date(`${value}T${end ? '23:59:59.999' : '00:00:00.000'}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET(request: Request) {
  try {
    const user = await requireRole(['SYSTEM_ADMIN', 'AGENCY_MANAGER']);
    const url = new URL(request.url);
    const from = parseDate(url.searchParams.get('from'));
    const to = parseDate(url.searchParams.get('to'), true);
    const [report, pipelineHistory] = await Promise.all([getAdvancedReports(user, from, to), getPipelineHistoryMetrics(user, from, to)]);
    return NextResponse.json({ ...report, pipelineHistory });
  } catch (error) {
    const out = apiError(error, 'خطا در دریافت گزارش‌ها');
    return NextResponse.json({ error: out.message }, { status: out.status });
  }
}
