import { NextResponse } from 'next/server';
import { listAgents } from '@/lib/repositories/agent-repository';

export async function GET() {
  try {
    return NextResponse.json(await listAgents());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطا در دریافت مشاورها' }, { status: 500 });
  }
}
