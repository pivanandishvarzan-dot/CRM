import { NextResponse } from 'next/server';
import { createProperty, listProperties } from '@/lib/repositories/properties';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const properties = await listProperties();
    return NextResponse.json({ data: properties });
  } catch (error) {
    console.error('Failed to load properties', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات ملک‌ها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.type || !body.deal || !body.city || !body.district) {
      return NextResponse.json({ error: 'اطلاعات اصلی ملک کامل نیست' }, { status: 400 });
    }
    const property = await createProperty({
      title: String(body.title),
      type: String(body.type),
      deal: body.deal,
      city: String(body.city),
      district: String(body.district),
      price: Number(body.price) || 0,
      area: Number(body.area) || 0,
      rooms: Number(body.rooms) || 0,
      floor: Number(body.floor) || 0,
      age: Number(body.age) || 0,
      ownerName: body.ownerName ? String(body.ownerName) : undefined,
      agentName: body.agentName ? String(body.agentName) : undefined,
    });
    return NextResponse.json({ data: property }, { status: 201 });
  } catch (error) {
    console.error('Failed to create property', error);
    return NextResponse.json({ error: 'خطا در ثبت ملک' }, { status: 500 });
  }
}
