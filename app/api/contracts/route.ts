import { NextResponse } from 'next/server';
import { createContract, listContracts } from '@/lib/repositories/contract-repository';

export async function GET() {
  try { return NextResponse.json(await listContracts()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'خطا در دریافت قراردادها' }, { status: 500 }); }
}

export async function POST(request: Request) {
  try { return NextResponse.json(await createContract(await request.json()), { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'خطا در ثبت قرارداد' }, { status: 400 }); }
}
