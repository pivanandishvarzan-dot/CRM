import { NextResponse } from 'next/server';
import { listAgents } from '@/lib/repositories/agent-repository';
import { requireUser } from '@/lib/authz';

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await listAgents(user));
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'نیاز به ورود دارید.' }, { status: 401 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطا در دریافت مشاورها' }, { status: 500 });
  }
}
