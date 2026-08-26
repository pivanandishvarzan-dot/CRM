import { NextResponse } from 'next/server';
import { createProperty, listProperties } from '@/lib/repositories/property-repository';
import { pagedProperties } from '@/lib/repositories/paged-list-repository';
import { requireUser } from '@/lib/authz';
import { apiError, finiteNumber, optionalId, optionalText, stringArray, text } from '@/lib/api-validation';
import { parsePagination } from '@/lib/pagination';

export async function GET(request:Request) {
  try { const user=await requireUser();const url=new URL(request.url);const page=parsePagination(url);if(page.enabled)return NextResponse.json(await pagedProperties(user,page.page,page.pageSize,url.searchParams.get('q')||''));return NextResponse.json({ data: await listProperties(user) }); }
  catch (error) { const out = apiError(error, 'دریافت ملک‌ها با خطا مواجه شد.'); return NextResponse.json({ error: out.message }, { status: out.status }); }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const property = await createProperty({
      title: text(body.title, 'عنوان'), type: text(body.type, 'نوع ملک', 80), deal: text(body.deal, 'نوع معامله', 50),
      status: optionalText(body.status, 50), city: text(body.city, 'شهر', 80), district: text(body.district, 'منطقه', 100), address: optionalText(body.address, 500),
      price: finiteNumber(body.price, 'قیمت'), area: finiteNumber(body.area, 'متراژ', 1, 100000), rooms: finiteNumber(body.rooms ?? 0, 'تعداد اتاق', 0, 100),
      floor: body.floor === '' || body.floor == null ? undefined : finiteNumber(body.floor, 'طبقه', -20, 300), age: body.age === '' || body.age == null ? undefined : finiteNumber(body.age, 'سن بنا', 0, 500),
      features: stringArray(body.features), image: optionalText(body.image, 2000), ownerId: optionalId(body.ownerId), agentId: optionalId(body.agentId), code: optionalText(body.code, 100),
    }, user);
    return NextResponse.json({ data: property }, { status: 201 });
  } catch (error) {
    const out = apiError(error, 'ثبت ملک با خطا مواجه شد.');
    return NextResponse.json({ error: out.message }, { status: out.status });
  }
}
