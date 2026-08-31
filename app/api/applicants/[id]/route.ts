import { NextResponse } from 'next/server';import { deleteApplicant } from '@/lib/repositories/contacts';
export async function DELETE(_:Request,{params}:{params:{id:string}}){try{await deleteApplicant(params.id);return new NextResponse(null,{status:204});}catch(e){console.error(e);return NextResponse.json({error:'متقاضی دارای ارتباطات ثبت‌شده است یا حذف ممکن نیست'},{status:409});}}
