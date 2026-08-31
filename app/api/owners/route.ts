import { NextResponse } from 'next/server';
import { createOwner, listOwners } from '@/lib/repositories/owner-repository';
import { requireUser } from '@/lib/authz';

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await listOwners(user));
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'نیاز به ورود دارید.' }, { status: 401 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطا در دریافت مالک‌ها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = await request.json();
    if (!body?.name || !body?.phone) return NextResponse.json({ error: 'نام و شماره تماس مالک الزامی است.' }, { status: 400 });
    const owner = await createOwner({ name: String(body.name).trim(), phone: String(body.phone).trim(), email: body.email ? String(body.email).trim() : undefined, address: body.address ? String(body.address).trim() : undefined, notes: body.notes ? String(body.notes).trim() : undefined });
    return NextResponse.json(owner, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'نیاز به ورود دارید.' }, { status: 401 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطا در ثبت مالک' }, { status: 500 });
  }
}
