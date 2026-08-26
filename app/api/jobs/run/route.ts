import { NextResponse } from 'next/server';
import { runDueAutomationJobs } from '@/lib/automation/job-queue';
import { generateSmartTasks } from '@/lib/automation/auto-task-generator';
import { runRiskEscalation } from '@/lib/automation/risk-escalation';
import { runCoachingPlanAutomation } from '@/lib/automation/coaching-plan-automation';

export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

async function run(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || 25);
    const [jobs, smartTasks, riskEscalation, coachingPlans] = await Promise.all([
      runDueAutomationJobs(Number.isFinite(limit) ? limit : 25),
      generateSmartTasks(),
      runRiskEscalation(),
      runCoachingPlanAutomation(),
    ]);
    return NextResponse.json({ jobs, smartTasks, riskEscalation, coachingPlans });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'JOB_RUNNER_FAILED' }, { status: 500 });
  }
}

export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }
