import { NextResponse } from 'next/server';
import { deleteProperty, getProperty } from '@/lib/repositories/properties';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const property = await getProperty(params.id);
    if (!property) return NextResponse.json({ error: 'ملک پیدا نشد' }, { status: 404 });
    return NextResponse.json({ data: property });
  } catch (error) {
    console.error('Failed to get property', error);
    return NextResponse.json({ error: 'خطا در دریافت ملک' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await deleteProperty(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete property', error);
    return NextResponse.json({ error: 'خطا در حذف ملک' }, { status: 500 });
  }
}
