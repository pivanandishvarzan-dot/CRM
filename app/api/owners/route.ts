import { NextResponse } from 'next/server';
import { createOwner, listOwners } from '@/lib/repositories/contacts';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json({data:await listOwners()});}catch(e){console.error(e);return NextResponse.json({error:'خطا در دریافت مالک‌ها'},{status:500});}}
export async function POST(req:Request){try{const b=await req.json();if(!b.name||!b.phone)return NextResponse.json({error:'نام و شماره تماس الزامی است'},{status:400});return NextResponse.json({data:await createOwner(b)},{status:201});}catch(e){console.error(e);return NextResponse.json({error:'خطا در ثبت مالک'},{status:500});}}
