'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ResponsiveContainer,AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip,PieChart,Pie,Cell} from 'recharts';
import {Building2,Users,PhoneCall,CalendarDays,TrendingUp,ArrowLeft,Clock,CheckCircle2,Sparkles,Loader2,Target,AlertTriangle} from 'lucide-react';
import {Badge} from './ui';

type Property={id:string;title:string;code:string;deal:string;area:number;price:number;status:string;agent:string;image:string;district:string;city:string};
type Applicant={id:string;name:string;urgency:string;request:string;budget:string;agent:string};
type Followup={id:string;title:string;scheduledAt:string;time:string;priority:string;completed:boolean;agent:string;type:string};

type ApiResult<T>={data:T};

async function loadJson<T>(url:string):Promise<T>{
 const response=await fetch(url,{cache:'no-store'});
 const body=await response.json();
 if(!response.ok)throw new Error(body.error||'خطا در دریافت اطلاعات داشبورد');
 return (body as ApiResult<T>).data;
}

const sameDay=(a:Date,b:Date)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();

export default function Dashboard(){
 const[properties,setProperties]=useState<Property[]>([]);
 const[applicants,setApplicants]=useState<Applicant[]>([]);
 const[followups,setFollowups]=useState<Followup[]>([]);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState('');

 useEffect(()=>{let active=true;(async()=>{try{setError('');const[p,a,f]=await Promise.all([loadJson<Property[]>('/api/properties'),loadJson<Applicant[]>('/api/applicants'),loadJson<Followup[]>('/api/followups')]);if(!active)return;setProperties(p);setApplicants(a);setFollowups(f)}catch(e){if(active)setError(e instanceof Error?e.message:'خطا در دریافت اطلاعات داشبورد')}finally{if(active)setLoading(false)}})();return()=>{active=false}},[]);

 const today=new Date();
 const todayFollowups=useMemo(()=>followups.filter(f=>sameDay(new Date(f.scheduledAt),today)),[followups]);
 const pendingToday=todayFollowups.filter(f=>!f.completed);
 const urgentApplicants=applicants.filter(a=>a.urgency==='فوری').length;
 const activeProperties=properties.filter(p=>p.status==='فعال').length;
 const totalPortfolio=properties.reduce((sum,p)=>sum+(Number(p.price)||0),0);
 const recent=properties.slice(0,4);
 const nextFollowups=followups.filter(f=>!f.completed).slice(0,4);
 const doneToday=todayFollowups.filter(f=>f.completed).length;
 const progress=todayFollowups.length?Math.round(doneToday/todayFollowups.length*100):0;
 const dateLabel=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(today);

 const chartData=properties.slice(0,9).reverse().map((p,i)=>({name:new Intl.NumberFormat('fa-IR').format(i+1),value:Number(p.price)||0,title:p.title}));
 const pieData=useMemo(()=>{
  const groups=[
   {name:'فعال',value:properties.filter(p=>p.status==='فعال').length,c:'#2f8b75'},
   {name:'در مذاکره',value:properties.filter(p=>p.status==='در مذاکره').length,c:'#d79a2b'},
   {name:'سایر',value:properties.filter(p=>!['فعال','در مذاکره'].includes(p.status)).length,c:'#a8b5b0'},
  ];
  return groups.filter(x=>x.value>0);
 },[properties]);

 if(loading)return <div className="card flex items-center justify-center gap-2 py-24 text-ink-500"><Loader2 className="animate-spin" size={20}/>در حال دریافت داشبورد...</div>;

 return <div className="space-y-5">
  {error&&<div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

  <section className="relative overflow-hidden rounded-3xl bg-brand-950 p-6 text-white shadow-float md:p-8">
   <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl"/><div className="absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-accent-500/10 blur-2xl"/>
   <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between"><div><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-brand-100"><Sparkles size={14}/>نمای زنده کسب‌وکار</div><p className="text-xs text-brand-200">{dateLabel}</p><h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">وضعیت امروز آژانس در یک نگاه</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-brand-100">امروز {new Intl.NumberFormat('fa-IR').format(todayFollowups.length)} پیگیری دارید و {new Intl.NumberFormat('fa-IR').format(pendingToday.length)} مورد هنوز باقی مانده است.</p></div><div className="flex flex-wrap gap-3"><Link href="/followups" className="btn border border-white/15 bg-white/10 text-white hover:bg-white/15"><CalendarDays size={17}/>برنامه امروز</Link><Link href="/properties" className="btn bg-white text-brand-950 hover:-translate-y-0.5"><Building2 size={17}/>مدیریت ملک‌ها</Link></div></div>
   <div className="relative mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p className="text-xs text-brand-200">ارزش سبد ثبت‌شده</p><div className="mt-2 flex items-end gap-2"><b className="text-2xl">{new Intl.NumberFormat('fa-IR',{maximumFractionDigits:1}).format(totalPortfolio)}</b><span className="pb-1 text-xs text-brand-200">میلیارد تومان</span></div></div><div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p className="text-xs text-brand-200">فایل‌های فعال</p><div className="mt-2 flex items-center gap-2"><b className="text-2xl">{new Intl.NumberFormat('fa-IR').format(activeProperties)}</b><span className="badge bg-brand-500/20 text-brand-100">از {new Intl.NumberFormat('fa-IR').format(properties.length)} فایل</span></div></div><div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p className="text-xs text-brand-200">پیشرفت پیگیری امروز</p><div className="mt-2 flex items-center gap-2"><b className="text-2xl">{new Intl.NumberFormat('fa-IR').format(progress)}٪</b><CheckCircle2 size={17} className="text-brand-300"/></div></div></div>
  </section>

  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
   <Metric title="کل ملک‌ها" value={properties.length} detail={`${activeProperties} فایل فعال`} icon={Building2}/>
   <Metric title="متقاضی‌ها" value={applicants.length} detail={`${urgentApplicants} متقاضی فوری`} icon={Users}/>
   <Metric title="پیگیری امروز" value={todayFollowups.length} detail={`${pendingToday.length} مورد باقی‌مانده`} icon={PhoneCall}/>
   <Metric title="انجام‌شده امروز" value={doneToday} detail={`${progress}٪ پیشرفت روزانه`} icon={TrendingUp}/>
  </section>

  <section className="grid gap-4 lg:grid-cols-3"><div className="card p-5 md:p-6 lg:col-span-2"><div className="mb-6 flex items-start justify-between gap-4"><div><h2 className="font-extrabold text-ink-900">ارزش فایل‌های اخیر</h2><p className="mt-1 text-xs text-ink-500">میلیارد تومان · آخرین فایل‌های ثبت‌شده</p></div><div className="text-left"><b className="text-lg text-brand-700">{new Intl.NumberFormat('fa-IR',{maximumFractionDigits:1}).format(totalPortfolio)} میلیارد</b><p className="mt-1 text-xs text-ink-500">ارزش کل سبد فعلی</p></div></div><div className="h-72" dir="ltr">{chartData.length?<ResponsiveContainer><AreaChart data={chartData}><defs><linearGradient id="dealValue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2f8b75" stopOpacity=".28"/><stop offset="1" stopColor="#2f8b75" stopOpacity="0"/></linearGradient></defs><CartesianGrid stroke="#edf1ef" strokeDasharray="4 5" vertical={false}/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#60716b'}}/><YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#60716b'}}/><Tooltip formatter={(value)=>[`${value} میلیارد`,'قیمت']} labelFormatter={(_,payload)=>payload?.[0]?.payload?.title??''} contentStyle={{borderRadius:16,border:'1px solid #edf1ef',boxShadow:'0 10px 35px rgba(23,33,30,.08)'}}/><Area type="monotone" dataKey="value" stroke="#236f5e" strokeWidth={3} fill="url(#dealValue)"/></AreaChart></ResponsiveContainer>:<div className="grid h-full place-items-center text-sm text-ink-500">هنوز ملکی ثبت نشده است.</div>}</div></div>
   <div className="card p-5 md:p-6"><div><h2 className="font-extrabold text-ink-900">سبد ملک‌ها</h2><p className="mt-1 text-xs text-ink-500">پراکندگی وضعیت فایل‌های فعلی</p></div><div className="relative h-48">{pieData.length?<><ResponsiveContainer><PieChart><Pie data={pieData} dataKey="value" innerRadius={57} outerRadius={78} paddingAngle={5} stroke="none">{pieData.map(x=><Cell key={x.name} fill={x.c}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="text-center"><b className="block text-xl text-ink-900">{new Intl.NumberFormat('fa-IR').format(properties.length)}</b><span className="text-[10px] text-ink-500">کل فایل‌ها</span></div></div></>:<div className="grid h-full place-items-center text-sm text-ink-500">بدون داده</div>}</div><div className="space-y-3">{pieData.map(x=><div className="flex items-center text-sm text-ink-600" key={x.name}><i className="ml-2.5 h-2.5 w-2.5 rounded-full" style={{background:x.c}}/>{x.name}<b className="mr-auto text-ink-900">{new Intl.NumberFormat('fa-IR').format(x.value)}</b></div>)}</div></div></section>

  <section className="grid gap-4 xl:grid-cols-5"><div className="card overflow-hidden xl:col-span-3"><div className="flex items-center justify-between p-5 md:px-6"><div><h2 className="font-extrabold text-ink-900">فایل‌های تازه</h2><p className="mt-1 text-xs text-ink-500">آخرین ملک‌های اضافه‌شده به سبد</p></div><Link href="/properties" className="flex items-center gap-1 text-xs font-bold text-brand-700">همه ملک‌ها <ArrowLeft size={14}/></Link></div>{recent.length?<div className="table-wrap rounded-none border-x-0 border-b-0"><table className="data-table"><tbody>{recent.map(p=><tr key={p.id}><td><div className="flex items-center gap-3">{p.image?<img src={p.image} alt="" className="h-12 w-16 rounded-2xl object-cover"/>:<span className="grid h-12 w-16 place-items-center rounded-2xl bg-ink-50"><Building2 size={18}/></span>}<div><b className="text-sm text-ink-900">{p.title}</b><small className="mt-1 block text-ink-500">{p.code} · {p.area} متر</small></div></div></td><td>{p.deal}</td><td className="font-semibold text-ink-900">{p.price} میلیارد</td><td><Badge tone={p.status==='فعال'?'green':'amber'}>{p.status}</Badge></td></tr>)}</tbody></table></div>:<div className="p-10 text-center text-sm text-ink-500">هنوز ملکی ثبت نشده است.</div>}</div>
   <div className="card p-5 md:p-6 xl:col-span-2"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-extrabold text-ink-900">اقدام‌های بعدی</h2><p className="mt-1 text-xs text-ink-500">پیگیری‌های باز که نیاز به توجه دارند</p></div>{nextFollowups.some(f=>f.priority==='فوری')&&<span className="badge bg-accent-50 text-accent-600">فوری</span>}</div><div className="space-y-3">{nextFollowups.length?nextFollowups.map(f=><div key={f.id} className="group flex gap-3 rounded-2xl border border-ink-100 p-3.5 transition hover:border-brand-100 hover:bg-brand-50/40"><div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${f.priority==='فوری'?'bg-accent-50 text-accent-600':'bg-brand-50 text-brand-700'}`}>{f.priority==='فوری'?<Clock size={17}/>:<CheckCircle2 size={17}/>}</div><div className="min-w-0"><b className="block truncate text-sm text-ink-900">{f.title}</b><p className="mt-1 text-xs text-ink-500">{f.time} · {f.agent}</p></div><ArrowLeft size={15} className="mr-auto mt-2 text-ink-300 opacity-0 transition group-hover:opacity-100"/></div>):<div className="rounded-2xl bg-ink-50 p-5 text-center text-sm text-ink-500">پیگیری بازی وجود ندارد.</div>}</div><Link href="/followups" className="btn-secondary mt-4 w-full">مشاهده برنامه کامل</Link></div></section>

  <section className="card p-5 md:p-6"><div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-extrabold text-ink-900">وضعیت متقاضی‌ها</h2><p className="mt-1 text-xs text-ink-500">اولویت‌بندی زنده برای تمرکز تیم فروش</p></div><div className="flex items-center gap-2 text-xs text-ink-500"><Target size={16} className="text-brand-600"/>{new Intl.NumberFormat('fa-IR').format(applicants.length)} متقاضی ثبت‌شده</div></div><div className="grid gap-4 md:grid-cols-3"><PriorityCard title="فوری" value={applicants.filter(a=>a.urgency==='فوری').length} icon={AlertTriangle}/><PriorityCard title="زیاد" value={applicants.filter(a=>a.urgency==='زیاد').length} icon={TrendingUp}/><PriorityCard title="عادی" value={applicants.filter(a=>a.urgency==='عادی').length} icon={Users}/></div></section>
 </div>;
}

function Metric({title,value,detail,icon:Icon}:{title:string;value:number;detail:string;icon:typeof Building2}){return <div className="card group p-5 transition duration-200 hover:-translate-y-1"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-ink-500">{title}</p><b className="mt-2 block text-3xl tracking-tight text-ink-900">{new Intl.NumberFormat('fa-IR').format(value)}</b></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Icon size={20}/></span></div><div className="mt-4 flex items-center gap-2 border-t border-ink-100 pt-3 text-xs text-ink-500"><TrendingUp size={14} className="text-brand-600"/>{detail}</div></div>}
function PriorityCard({title,value,icon:Icon}:{title:string;value:number;icon:typeof Users}){return <div className="rounded-2xl border border-ink-100 p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={18}/></span><div><p className="text-xs text-ink-500">اولویت {title}</p><b className="mt-1 block text-xl text-ink-900">{new Intl.NumberFormat('fa-IR').format(value)}</b></div></div></div>}
