import { NextResponse } from 'next/server';
import { listProperties } from '@/lib/repositories/properties';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const properties = await listProperties();
    return NextResponse.json({ data: properties });
  } catch (error) {
    console.error('Failed to load properties', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات ملک‌ها' },
      { status: 500 },
    );
  }
}
