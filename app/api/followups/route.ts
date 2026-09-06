import {NextResponse} from 'next/server';
import {createFollowup,listFollowups} from '@/lib/repositories/followups';
import {apiAccessMessage,apiAccessStatus,requireAnyApiPermission} from '@/lib/api-access';
export const dynamic='force-dynamic';

async function followupSession(){
  return requireAnyApiPermission(['MANAGE_OWN_FOLLOWUPS','MANAGE_ALL_FOLLOWUPS']);
}

export async function GET(){
 try{
  const session=await followupSession();
  const role=session.user.role;
  const userId=session.user.id;
  return NextResponse.json({data:await listFollowups(role==='AGENT'?userId:undefined)})
 }catch(error){
  console.error('Failed to load followups',error);
  return NextResponse.json({error:apiAccessMessage(error,'خطا در دریافت پیگیری‌ها')},{status:apiAccessStatus(error)});
 }
}

export async function POST(req:Request){
 try{
  const session=await followupSession();
  const b=await req.json();
  if(!b.title||!b.type||!b.scheduledAt)return NextResponse.json({error:'عنوان، نوع و زمان پیگیری الزامی است'},{status:400});
  const date=new Date(b.scheduledAt);if(Number.isNaN(date.getTime()))return NextResponse.json({error:'زمان پیگیری معتبر نیست'},{status:400});
  const role=session.user.role;
  const assigneeId=role==='AGENT'?session.user.id:(b.assigneeId?String(b.assigneeId):undefined);
  return NextResponse.json({data:await createFollowup({...b,assigneeId,priority:Number(b.priority)||1})},{status:201})
 }catch(error){
  console.error('Failed to create followup',error);
  return NextResponse.json({error:apiAccessMessage(error,'خطا در ثبت پیگیری')},{status:apiAccessStatus(error)});
 }
}
