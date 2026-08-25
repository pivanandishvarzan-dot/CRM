'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileSignature,
  PhoneCall,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { agents, applicants, contracts, followups, properties } from '@/lib/demo-data';
import { Badge } from './ui';

const monthly = [
  { m: 'فروردین', v: 12 },
  { m: 'اردیبهشت', v: 18 },
  { m: 'خرداد', v: 15 },
  { m: 'تیر', v: 24 },
  { m: 'مرداد', v: 20 },
  { m: 'شهریور', v: 29 },
  { m: 'مهر', v: 33 },
  { m: 'آبان', v: 28 },
  { m: 'آذر', v: 41 },
];

function formatPersianDate() {
  return new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

export default function Dashboard() {
  const activeProperties = properties.filter((property) => property.status === 'فعال').length;
  const todayFollowups = followups.filter((followup) => followup.time.includes('امروز')).length;
  const upcomingMeetings = followups.filter((followup) => ['جلسه', 'بازدید'].includes(followup.type)).length;
  const completedContracts = contracts.filter((contract) => contract.status === 'تکمیل شده').length;

  const propertyStatus = [
    {
      name: 'فعال',
      value: activeProperties,
      color: '#14b88a',
    },
    {
      name: 'در مذاکره',
      value: properties.filter((property) => property.status === 'در مذاکره').length,
      color: '#f59e0b',
    },
    {
      name: 'نهایی‌شده',
      value: properties.filter((property) => property.status === 'فروخته شد').length,
      color: '#94a3b8',
    },
  ].filter((item) => item.value > 0);

  const cards = [
    {
      title: 'کل ملک‌ها',
      value: properties.length.toLocaleString('fa-IR'),
      detail: `${activeProperties.toLocaleString('fa-IR')} ملک فعال`,
      icon: Building2,
    },
    {
      title: 'ملک‌های فعال',
      value: activeProperties.toLocaleString('fa-IR'),
      detail: `${properties.filter((property) => property.status === 'ویژه').length.toLocaleString('fa-IR')} فایل ویژه`,
      icon: TrendingUp,
    },
    {
      title: 'متقاضی فعال',
      value: applicants.length.toLocaleString('fa-IR'),
      detail: `${applicants.filter((applicant) => applicant.urgency === 'فوری').length.toLocaleString('fa-IR')} مورد فوری`,
      icon: Users,
    },
    {
      title: 'پیگیری امروز',
      value: todayFollowups.toLocaleString('fa-IR'),
      detail: `${followups.filter((followup) => followup.priority === 'عقب‌افتاده').length.toLocaleString('fa-IR')} مورد عقب‌افتاده`,
      icon: PhoneCall,
    },
    {
      title: 'جلسات و بازدیدها',
      value: upcomingMeetings.toLocaleString('fa-IR'),
      detail: 'برنامه‌ریزی‌شده در دمو',
      icon: CalendarDays,
    },
    {
      title: 'قراردادها',
      value: contracts.length.toLocaleString('fa-IR'),
      detail: `${completedContracts.toLocaleString('fa-IR')} قرارداد تکمیل‌شده`,
      icon: FileSignature,
    },
  ] as const;

  return (
    <>
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{formatPersianDate()}</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">سلام مهدی، روز بخیر 👋</h1>
          <p className="mt-2 text-sm text-slate-500">خلاصه وضعیت آژانس شما در یک نگاه</p>
        </div>
        <Link href="/properties" className="btn-primary hidden md:flex">
          ثبت ملک جدید
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ title, value, detail, icon: Icon }) => (
          <div className="card p-5" key={title}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{title}</p>
                <b className="mt-2 block text-2xl">{value}</b>
                <small className="mt-2 block text-brand-700">{detail}</small>
              </div>
              <span className="rounded-xl bg-brand-50 p-3 text-brand-700">
                <Icon size={22} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold">روند ارزش معاملات</h2>
              <p className="mt-1 text-xs text-slate-500">میلیارد تومان · داده نمایشی ۹ ماه گذشته</p>
            </div>
            <b className="text-brand-700">۲۴۸.۵ میلیارد</b>
          </div>

          <div className="h-64" dir="ltr">
            <ResponsiveContainer>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="dashboardArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#14b88a" stopOpacity=".25" />
                    <stop offset="1" stopColor="#14b88a" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#0d9672"
                  strokeWidth={3}
                  fill="url(#dashboardArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-bold">وضعیت ملک‌ها</h2>
          <p className="mt-1 text-xs text-slate-500">براساس داده‌های ثبت‌شده فعلی</p>

          <div className="h-44">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={propertyStatus} dataKey="value" innerRadius={50} outerRadius={72} paddingAngle={4}>
                  {propertyStatus.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {propertyStatus.map((item) => (
              <div className="flex items-center text-sm" key={item.name}>
                <i className="ml-2 h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                {item.name}
                <b className="mr-auto">{item.value.toLocaleString('fa-IR')}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <div className="card xl:col-span-3">
          <div className="flex items-center justify-between p-5">
            <h2 className="font-bold">آخرین ملک‌ها</h2>
            <Link href="/properties" className="flex items-center gap-1 text-xs text-brand-700">
              مشاهده همه <ArrowLeft size={14} />
            </Link>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <tbody>
                {properties.slice(0, 4).map((property) => (
                  <tr key={property.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img src={property.image} alt={property.title} className="h-11 w-14 rounded-lg object-cover" />
                        <div>
                          <b>{property.title}</b>
                          <small className="block text-slate-500">
                            {property.code} · {property.area.toLocaleString('fa-IR')} متر
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{property.deal}</td>
                    <td>{property.price.toLocaleString('fa-IR')} میلیارد</td>
                    <td>
                      <Badge tone={property.status === 'فعال' ? 'green' : 'amber'}>{property.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5 xl:col-span-2">
          <div className="mb-4 flex justify-between">
            <h2 className="font-bold">پیگیری‌های فوری</h2>
            <Link href="/followups" className="text-xs text-brand-700">
              مشاهده همه
            </Link>
          </div>

          <div className="space-y-3">
            {followups.slice(0, 4).map((followup) => (
              <div key={followup.id} className="flex gap-3 rounded-xl border border-slate-100 p-3">
                <div className="mt-1 text-brand-600">
                  {followup.priority === 'فوری' || followup.priority === 'عقب‌افتاده' ? (
                    <Clock size={18} />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                </div>
                <div>
                  <b className="text-sm">{followup.title}</b>
                  <p className="mt-1 text-xs text-slate-500">
                    {followup.time} · {followup.agent}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 card p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-bold">عملکرد مشاوران</h2>
            <p className="mt-1 text-xs text-slate-500">مقایسه عملکرد تیم در داده‌های نمایشی</p>
          </div>
          <Link href="/reports" className="text-xs text-brand-700">
            گزارش کامل
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {agents.map((agent) => (
            <div key={agent.name}>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
                  {agent.name[0]}
                </div>
                <div>
                  <b className="text-sm">{agent.name}</b>
                  <p className="text-xs text-slate-500">
                    {agent.deals.toLocaleString('fa-IR')} قرارداد · {agent.value} میلیارد
                  </p>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded bg-slate-100">
                <div className="h-full rounded bg-brand-500" style={{ width: `${agent.rate}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
