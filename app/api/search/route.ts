import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import { globalSearch } from '@/lib/repositories/search-repository';
import { apiError } from '@/lib/api-validation';

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const q = new URL(request.url).searchParams.get('q')?.trim() || '';
    if (q.length < 2) return NextResponse.json({ data: [] });
    return NextResponse.json({ data: await globalSearch(q.slice(0, 100), user) });
  } catch (error) {
    const out = apiError(error, 'جست‌وجوی سراسری انجام نشد.');
    return NextResponse.json({ error: out.message }, { status: out.status });
  }
}
