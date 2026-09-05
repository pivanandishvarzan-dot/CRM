import { NextResponse } from 'next/server';
import { createProperty, listProperties } from '@/lib/repositories/properties';
import { requireApiPermission } from '@/lib/api-access';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let session;
    try { session = await requireApiPermission('MANAGE_OWN_PROPERTIES'); }
    catch { session = await requireApiPermission('MANAGE_ALL_PROPERTIES'); }
    const role = (session.user as any).role;
    const userId = (session.user as any).id;
    const properties = await listProperties(role === 'AGENT' ? userId : undefined);
    return NextResponse.json({ data: properties });
  } catch (error) {
    console.error('Failed to load properties', error);
    return NextResponse.json({ error: 'دسترسی غیرمجاز یا خطا در دریافت اطلاعات ملک‌ها' }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    let session;
    try { session = await requireApiPermission('MANAGE_OWN_PROPERTIES'); }
    catch { session = await requireApiPermission('MANAGE_ALL_PROPERTIES'); }
    const body = await request.json();
    if (!body.title || !body.type || !body.deal || !body.city || !body.district) return NextResponse.json({ error: 'اطلاعات اصلی ملک کامل نیست' }, { status: 400 });
    const role = (session.user as any).role;
    const property = await createProperty({
      title:String(body.title), type:String(body.type), deal:body.deal, city:String(body.city), district:String(body.district),
      price:Number(body.price)||0, area:Number(body.area)||0, rooms:Number(body.rooms)||0, floor:Number(body.floor)||0, age:Number(body.age)||0,
      ownerName:body.ownerName?String(body.ownerName):undefined,
      agentName:role === 'AGENT' ? undefined : (body.agentName?String(body.agentName):undefined),
      agentId:role === 'AGENT' ? (session.user as any).id : (body.agentId?String(body.agentId):undefined),
    });
    return NextResponse.json({ data: property }, { status: 201 });
  } catch (error) {
    console.error('Failed to create property', error);
    return NextResponse.json({ error: 'دسترسی غیرمجاز یا خطا در ثبت ملک' }, { status: 403 });
  }
}
