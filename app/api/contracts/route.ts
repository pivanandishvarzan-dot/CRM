import { NextResponse } from 'next/server';
import { createContract, listContracts } from '@/lib/repositories/contract-repository';
import { requireUser } from '@/lib/authz';

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await listContracts(user));
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'نیاز به ورود دارید.' }, { status: 401 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطا در دریافت قراردادها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    return NextResponse.json(await createContract(await request.json(), user), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'نیاز به ورود دارید.' }, { status: 401 });
    if (error instanceof Error && error.message === 'FORBIDDEN') return NextResponse.json({ error: 'دسترسی مجاز نیست.' }, { status: 403 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطا در ثبت قرارداد' }, { status: 400 });
  }
}
