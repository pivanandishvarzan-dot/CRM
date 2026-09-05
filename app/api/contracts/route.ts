import {NextResponse} from 'next/server';
import {createContract,listContracts} from '@/lib/repositories/contracts';
import {apiAccessStatus,requireApiPermission} from '@/lib/api-access';
export const dynamic='force-dynamic';

export async function GET(){
 try{
  await requireApiPermission('MANAGE_CONTRACTS');
  return NextResponse.json({data:await listContracts()})
 }catch(e){
  console.error(e);
  const status=apiAccessStatus(e);
  return NextResponse.json({error:status===500?'خطا در دریافت قراردادها':'دسترسی غیرمجاز'},{status})
 }
}

export async function POST(req:Request){
 try{
  await requireApiPermission('MANAGE_CONTRACTS');
  const b=await req.json();
  const amount=Number(b.amount),commission=Number(b.commission);
  if(!b.type||!b.contractDate||!Number.isFinite(amount)||amount<=0||!Number.isFinite(commission)||commission<0)return NextResponse.json({error:'اطلاعات قرارداد کامل یا معتبر نیست'},{status:400});
  const date=new Date(b.contractDate);if(Number.isNaN(date.getTime()))return NextResponse.json({error:'تاریخ قرارداد معتبر نیست'},{status:400});
  return NextResponse.json({data:await createContract({...b,amount,commission})},{status:201})
 }catch(e){
  console.error(e);
  const status=apiAccessStatus(e);
  return NextResponse.json({error:status===500?'خطا در ثبت قرارداد':'دسترسی غیرمجاز'},{status})
 }
}
