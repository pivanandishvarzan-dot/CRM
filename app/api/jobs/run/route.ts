import { NextResponse } from 'next/server';
import { runDueAutomationJobs } from '@/lib/automation/job-queue';

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || 25);
    return NextResponse.json(await runDueAutomationJobs(Number.isFinite(limit) ? limit : 25));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'JOB_RUNNER_FAILED' }, { status: 500 });
  }
}
