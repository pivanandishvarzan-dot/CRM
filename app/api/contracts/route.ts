import {NextResponse} from 'next/server';
import {createContract,listContracts} from '@/lib/repositories/contracts';
import {apiAccessMessage,apiAccessStatus,ApiAccessError,requireApiPermission} from '@/lib/api-access';
import {prisma} from '@/lib/prisma';

export const dynamic='force-dynamic';

async function contractScope(){
 const session=await requireApiPermission('MANAGE_CONTRACTS');
 if(session.user.role==='SYSTEM_ADMIN')return undefined;
 const actor=await prisma.user.findUnique({where:{id:session.user.id},select:{agencyId:true}});
 if(!actor?.agencyId)throw new ApiAccessError(403,'کاربر به آژانسی متصل نیست');
 return actor.agencyId;
}

export async function GET(){
 try{
  const agencyId=await contractScope();
  return NextResponse.json({data:await listContracts(agencyId)});
 }catch(e){
  console.error(e);
  return NextResponse.json({error:apiAccessMessage(e,'خطا در دریافت قراردادها')},{status:apiAccessStatus(e)});
 }
}

export async function POST(req:Request){
 try{
  const agencyId=await contractScope();
  const b=await req.json();
  const amount=Number(b.amount),commission=Number(b.commission);
  if(!b.type||!b.contractDate||!Number.isFinite(amount)||amount<=0||!Number.isFinite(commission)||commission<0)return NextResponse.json({error:'اطلاعات قرارداد کامل یا معتبر نیست'},{status:400});
  const date=new Date(b.contractDate);if(Number.isNaN(date.getTime()))return NextResponse.json({error:'تاریخ قرارداد معتبر نیست'},{status:400});
  return NextResponse.json({data:await createContract({...b,amount,commission},agencyId)},{status:201});
 }catch(e){
  console.error(e);
  if(e instanceof Error&&e.message==='FORBIDDEN_OR_NOT_FOUND')return NextResponse.json({error:'منابع انتخاب‌شده خارج از آژانس شما هستند یا یافت نشدند'},{status:404});
  return NextResponse.json({error:apiAccessMessage(e,'خطا در ثبت قرارداد')},{status:apiAccessStatus(e)});
 }
}
