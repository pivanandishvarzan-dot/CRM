import { NextResponse } from 'next/server';
import { deleteProperty } from '@/lib/repositories/properties';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await deleteProperty(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete property', error);
    return NextResponse.json({ error: 'خطا در حذف ملک' }, { status: 500 });
  }
}
