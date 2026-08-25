import { NextResponse } from 'next/server';
import { createProperty, listProperties } from '@/lib/repositories/property-repository';
import { requireUser } from '@/lib/authz';

export async function GET() {
  try {
    const user = await requireUser();
    const properties = await listProperties(user);
    return NextResponse.json({ data: properties });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'نیاز به ورود دارید.' }, { status: 401 });
    console.error('GET /api/properties failed', error);
    return NextResponse.json({ error: 'دریافت ملک‌ها با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    if (!body?.title || !body?.type || !body?.deal || !body?.city || !body?.district) {
      return NextResponse.json({ error: 'عنوان، نوع ملک، نوع معامله، شهر و منطقه الزامی هستند.' }, { status: 400 });
    }
    const property = await createProperty({ ...body, price: Number(body.price || 0), area: Number(body.area || 0), rooms: Number(body.rooms || 0), floor: body.floor === '' || body.floor == null ? undefined : Number(body.floor), age: body.age === '' || body.age == null ? undefined : Number(body.age), features: Array.isArray(body.features) ? body.features : [] }, user);
    return NextResponse.json({ data: property }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'نیاز به ورود دارید.' }, { status: 401 });
    if (error instanceof Error && error.message === 'FORBIDDEN') return NextResponse.json({ error: 'دسترسی مجاز نیست.' }, { status: 403 });
    console.error('POST /api/properties failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'ثبت ملک با خطا مواجه شد.' }, { status: 500 });
  }
}
