import { NextResponse } from 'next/server';import { deleteOwner } from '@/lib/repositories/contacts';
export async function DELETE(_:Request,{params}:{params:{id:string}}){try{await deleteOwner(params.id);return new NextResponse(null,{status:204});}catch(e){console.error(e);return NextResponse.json({error:'مالک دارای ارتباطات ثبت‌شده است یا حذف ممکن نیست'},{status:409});}}
