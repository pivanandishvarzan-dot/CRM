import { NextResponse } from 'next/server';
import { deleteProperty, getProperty, updateProperty } from '@/lib/repositories/property-repository';
import { requireUser } from '@/lib/authz';

function authError(error: unknown) {
  if (!(error instanceof Error)) return null;
  if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'نیاز به ورود دارید.' }, { status: 401 });
  if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'دسترسی مجاز نیست.' }, { status: 403 });
  return null;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const property = await getProperty(params.id, user);
    if (!property) return NextResponse.json({ error: 'ملک پیدا نشد یا دسترسی ندارید.' }, { status: 404 });
    return NextResponse.json({ data: property });
  } catch (error) {
    const response = authError(error); if (response) return response;
    console.error('GET /api/properties/[id] failed', error);
    return NextResponse.json({ error: 'دریافت ملک با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const property = await updateProperty(params.id, { ...body, ...(body.price !== undefined && { price: Number(body.price) }), ...(body.area !== undefined && { area: Number(body.area) }), ...(body.rooms !== undefined && { rooms: Number(body.rooms) }), ...(body.floor !== undefined && { floor: body.floor === '' ? undefined : Number(body.floor) }), ...(body.age !== undefined && { age: body.age === '' ? undefined : Number(body.age) }) }, user);
    if (!property) return NextResponse.json({ error: 'ملک پیدا نشد یا دسترسی ندارید.' }, { status: 404 });
    return NextResponse.json({ data: property });
  } catch (error) {
    const response = authError(error); if (response) return response;
    console.error('PATCH /api/properties/[id] failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'ویرایش ملک با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await deleteProperty(params.id, user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const response = authError(error); if (response) return response;
    if (error instanceof Error && error.message === 'NOT_FOUND') return NextResponse.json({ error: 'ملک پیدا نشد یا دسترسی ندارید.' }, { status: 404 });
    console.error('DELETE /api/properties/[id] failed', error);
    return NextResponse.json({ error: 'حذف ملک با خطا مواجه شد.' }, { status: 500 });
  }
}
