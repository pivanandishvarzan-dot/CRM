import {NextResponse} from 'next/server';
import {createFollowup,listFollowups} from '@/lib/repositories/followups';
import {requireApiPermission} from '@/lib/api-access';
export const dynamic='force-dynamic';

async function followupSession(){
 try{return await requireApiPermission('MANAGE_OWN_FOLLOWUPS')}
 catch{return requireApiPermission('MANAGE_ALL_FOLLOWUPS')}
}

export async function GET(){
 try{
  const session=await followupSession();
  const role=(session.user as any).role;
  const userId=(session.user as any).id;
  return NextResponse.json({data:await listFollowups(role==='AGENT'?userId:undefined)})
 }catch(e){console.error(e);return NextResponse.json({error:'دسترسی غیرمجاز یا خطا در دریافت پیگیری‌ها'},{status:403})}
}

export async function POST(req:Request){
 try{
  const session=await followupSession();
  const b=await req.json();
  if(!b.title||!b.type||!b.scheduledAt)return NextResponse.json({error:'عنوان، نوع و زمان پیگیری الزامی است'},{status:400});
  const date=new Date(b.scheduledAt);if(Number.isNaN(date.getTime()))return NextResponse.json({error:'زمان پیگیری معتبر نیست'},{status:400});
  const role=(session.user as any).role;
  const assigneeId=role==='AGENT'?(session.user as any).id:(b.assigneeId?String(b.assigneeId):undefined);
  return NextResponse.json({data:await createFollowup({...b,assigneeId,priority:Number(b.priority)||1})},{status:201})
 }catch(e){console.error(e);return NextResponse.json({error:'دسترسی غیرمجاز یا خطا در ثبت پیگیری'},{status:403})}
}
