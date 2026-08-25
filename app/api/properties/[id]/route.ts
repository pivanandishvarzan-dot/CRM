import { NextResponse } from 'next/server';
import { deleteProperty, getProperty, updateProperty } from '@/lib/repositories/property-repository';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const property = await getProperty(params.id);
    if (!property) return NextResponse.json({ error: 'ملک پیدا نشد.' }, { status: 404 });
    return NextResponse.json({ data: property });
  } catch (error) {
    console.error('GET /api/properties/[id] failed', error);
    return NextResponse.json({ error: 'دریافت ملک با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const property = await updateProperty(params.id, {
      ...body,
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.area !== undefined && { area: Number(body.area) }),
      ...(body.rooms !== undefined && { rooms: Number(body.rooms) }),
      ...(body.floor !== undefined && { floor: body.floor === '' ? undefined : Number(body.floor) }),
      ...(body.age !== undefined && { age: body.age === '' ? undefined : Number(body.age) }),
    });

    if (!property) return NextResponse.json({ error: 'ملک پیدا نشد.' }, { status: 404 });
    return NextResponse.json({ data: property });
  } catch (error) {
    console.error('PATCH /api/properties/[id] failed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ویرایش ملک با خطا مواجه شد.' },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await deleteProperty(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/properties/[id] failed', error);
    return NextResponse.json({ error: 'حذف ملک با خطا مواجه شد.' }, { status: 500 });
  }
}
