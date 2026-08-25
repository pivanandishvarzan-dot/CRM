'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  FileSignature,
  PhoneCall,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from './ui';

type DashboardData = {
  kpis: {
    properties: number;
    activeProperties: number;
    applicants: number;
    urgentApplicants: number;
    todayFollowups: number;
    overdueFollowups: number;
    visits: number;
    negotiations: number;
    contracts: number;
    completedContracts: number;
    totalContractValue: number;
    totalCommission: number;
    conversionRate: number;
  };
  pipeline: { stage: string; count: number }[];
  recentProperties: any[];
  urgentFollowups: any[];
  agents: { name: string; contracts: number; value: number; commission: number; conversionRate: number }[];
};

const stageLabels: Record<string, string> = {
  LEAD: 'سرنخ', CONTACTED: 'تماس', QUALIFIED: 'نیازسنجی', MATCHED: 'پیشنهاد',
  VISIT: 'بازدید', NEGOTIATION: 'مذاکره', CONTRACT: 'قرارداد', WON: 'نهایی',
};

function formatPersianDate() {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
}

function money(value: number) {
  return value.toLocaleString('fa-IR', { maximumFractionDigits: 1 });
}

function normalizeProperty(item: any) {
  return {
    id: String(item.id),
    title: item.title,
    code: item.code,
    area: item.area,
    deal: item.deal ?? ({ SALE: 'فروش', RENT: 'اجاره', MORTGAGE_RENT: 'رهن و اجاره' } as Record<string,string>)[item.dealType] ?? item.dealType,
    price: Number(item.price ?? 0),
    status: item.status === 'ACTIVE' ? 'فعال' : item.status === 'NEGOTIATING' ? 'در مذاکره' : item.status === 'SOLD' ? 'فروخته شد' : item.status,
    image: item.image ?? item.images?.[0] ?? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=70',
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard')
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'خطا در دریافت داشبورد');
        setData(result);
      })
      .catch(err => setError(err.message || 'خطا در دریافت داشبورد'));
  }, []);

  const pipeline = useMemo(() => (data?.pipeline ?? []).map(item => ({ ...item, label: stageLabels[item.stage] ?? item.stage })), [data]);

  if (!data) {
    return <div className="card p-10 text-center text-sm text-slate-500">{error || 'در حال آماده‌سازی داشبورد مدیریتی...'}</div>;
  }

  const k = data.kpis;
  const propertyStatus = [
    { name: 'فعال', value: k.activeProperties, color: '#14b88a' },
    { name: 'در مذاکره', value: k.negotiations, color: '#f59e0b' },
    { name: 'سایر', value: Math.max(0, k.properties - k.activeProperties - k.negotiations), color: '#94a3b8' },
  ].filter(x => x.value > 0);

  const cards = [
    { title: 'کل ملک‌ها', value: k.properties, detail: `${k.activeProperties.toLocaleString('fa-IR')} فایل فعال`, icon: Building2 },
    { title: 'متقاضی‌ها', value: k.applicants, detail: `${k.urgentApplicants.toLocaleString('fa-IR')} مورد فوری`, icon: Users },
    { title: 'پیگیری امروز', value: k.todayFollowups, detail: `${k.overdueFollowups.toLocaleString('fa-IR')} عقب‌افتاده`, icon: PhoneCall },
    { title: 'بازدیدها', value: k.visits, detail: `${k.negotiations.toLocaleString('fa-IR')} پرونده در مذاکره`, icon: CalendarDays },
    { title: 'قراردادها', value: k.contracts, detail: `${k.completedContracts.toLocaleString('fa-IR')} تکمیل‌شده`, icon: FileSignature },
    { title: 'نرخ تبدیل', value: `${k.conversionRate}٪`, detail: 'متقاضی به قرارداد موفق', icon: TrendingUp },
  ];

  return <>
    <div className="mb-7 flex items-end justify-between gap-4">
      <div><p className="text-sm text-slate-500">{formatPersianDate()}</p><h1 className="mt-1 text-2xl font-bold md:text-3xl">داشبورد مدیریتی</h1><p className="mt-2 text-sm text-slate-500">خلاصه لحظه‌ای فروش، پیگیری و عملکرد تیم</p></div>
      <Link href="/pipeline" className="btn-primary hidden md:flex">مشاهده Pipeline</Link>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(({title,value,detail,icon:Icon}) => <div className="card p-5" key={title}><div className="flex items-start justify-between"><div><p className="text-sm text-slate-500">{title}</p><b className="mt-2 block text-2xl">{typeof value === 'number' ? value.toLocaleString('fa-IR') : value}</b><small className="mt-2 block text-brand-700">{detail}</small></div><span className="rounded-xl bg-brand-50 p-3 text-brand-700"><Icon size={22}/></span></div></div>)}</div>

    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      <div className="card p-5 lg:col-span-2">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">قیف فروش</h2><p className="mt-1 text-xs text-slate-500">تعداد پرونده‌ها در هر مرحله Pipeline</p></div><Link href="/pipeline" className="text-xs text-brand-700">باز کردن کانبان</Link></div>
        <div className="h-72" dir="ltr"><ResponsiveContainer><BarChart data={pipeline}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" tick={{fontSize:10}}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" fill="#14b88a" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div>
      </div>
      <div className="card p-5"><h2 className="font-bold">وضعیت فایل‌ها</h2><p className="mt-1 text-xs text-slate-500">ترکیب فایل‌های فعلی</p><div className="h-44"><ResponsiveContainer><PieChart><Pie data={propertyStatus} dataKey="value" innerRadius={50} outerRadius={72} paddingAngle={4}>{propertyStatus.map(item => <Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div><div className="space-y-3">{propertyStatus.map(item => <div className="flex items-center text-sm" key={item.name}><i className="ml-2 h-2.5 w-2.5 rounded-full" style={{background:item.color}}/>{item.name}<b className="mr-auto">{item.value.toLocaleString('fa-IR')}</b></div>)}</div></div>
    </div>

    <div className="mt-4 grid gap-4 md:grid-cols-3">
      <div className="card p-5"><WalletCards className="mb-3 text-brand-600"/><p className="text-sm text-slate-500">ارزش کل قراردادها</p><b className="mt-2 block text-xl">{money(k.totalContractValue)} میلیارد</b></div>
      <div className="card p-5"><TrendingUp className="mb-3 text-brand-600"/><p className="text-sm text-slate-500">کمیسیون ثبت‌شده</p><b className="mt-2 block text-xl">{money(k.totalCommission)} میلیارد</b></div>
      <div className="card p-5"><FileSignature className="mb-3 text-brand-600"/><p className="text-sm text-slate-500">نرخ موفقیت قرارداد</p><b className="mt-2 block text-xl">{k.contracts ? Math.round((k.completedContracts/k.contracts)*100) : 0}٪</b></div>
    </div>

    <div className="mt-4 grid gap-4 xl:grid-cols-5">
      <div className="card xl:col-span-3"><div className="flex items-center justify-between p-5"><h2 className="font-bold">آخرین ملک‌ها</h2><Link href="/properties" className="flex items-center gap-1 text-xs text-brand-700">مشاهده همه <ArrowLeft size={14}/></Link></div><div className="table-wrap"><table className="data-table"><tbody>{data.recentProperties.map(raw => { const p = normalizeProperty(raw); return <tr key={p.id}><td><div className="flex items-center gap-3"><img src={p.image} alt={p.title} className="h-11 w-14 rounded-lg object-cover"/><div><b>{p.title}</b><small className="block text-slate-500">{p.code} · {Number(p.area).toLocaleString('fa-IR')} متر</small></div></div></td><td>{p.deal}</td><td>{p.price.toLocaleString('fa-IR')} میلیارد</td><td><Badge tone={p.status==='فعال'?'green':'amber'}>{p.status}</Badge></td></tr>; })}</tbody></table></div></div>
      <div className="card p-5 xl:col-span-2"><div className="mb-4 flex justify-between"><h2 className="font-bold">پیگیری‌های مهم</h2><Link href="/followups" className="text-xs text-brand-700">همه</Link></div><div className="space-y-3">{data.urgentFollowups.map(item => <div key={String(item.id)} className="rounded-xl border border-slate-100 p-3"><div className="flex items-center justify-between gap-2"><b className="text-sm">{item.title}</b><Badge tone={item.priority>=4?'red':'amber'}>{item.priority>=4?'فوری':'مهم'}</Badge></div><p className="mt-1 text-xs text-slate-500">{new Intl.DateTimeFormat('fa-IR-u-ca-persian',{dateStyle:'short',timeStyle:'short'}).format(new Date(item.scheduledAt))} · {item.assignee?.name || 'بدون مسئول'}</p></div>)}</div></div>
    </div>

    <div className="mt-4 card p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">عملکرد مشاوران</h2><p className="mt-1 text-xs text-slate-500">بر اساس قرارداد، ارزش فروش و نرخ تبدیل</p></div><Link href="/reports" className="text-xs text-brand-700">گزارش کامل</Link></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{data.agents.map(agent => <div key={agent.name} className="rounded-xl border border-slate-100 p-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{agent.name[0]}</div><div><b className="text-sm">{agent.name}</b><p className="text-xs text-slate-500">{agent.contracts.toLocaleString('fa-IR')} قرارداد · {money(agent.value)} میلیارد</p></div></div><div className="mt-3 flex justify-between text-xs text-slate-500"><span>کمیسیون {money(agent.commission)}</span><b className="text-brand-700">تبدیل {agent.conversionRate}٪</b></div><div className="mt-2 h-1.5 rounded bg-slate-100"><div className="h-full rounded bg-brand-500" style={{width:`${Math.min(100,agent.conversionRate)}%`}}/></div></div>)}</div></div>
  </>;
}
