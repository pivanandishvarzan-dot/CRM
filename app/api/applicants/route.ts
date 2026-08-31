import { NextResponse } from 'next/server';
import { createApplicant, listApplicants } from '@/lib/repositories/contacts';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json({data:await listApplicants()});}catch(e){console.error(e);return NextResponse.json({error:'خطا در دریافت متقاضی‌ها'},{status:500});}}
export async function POST(req:Request){try{const b=await req.json();if(!b.name||!b.phone||!b.requestType)return NextResponse.json({error:'اطلاعات ضروری ناقص است'},{status:400});return NextResponse.json({data:await createApplicant(b)},{status:201});}catch(e){console.error(e);return NextResponse.json({error:'خطا در ثبت متقاضی'},{status:500});}}
