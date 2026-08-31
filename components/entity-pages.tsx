'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { applicants as demoApplicants, followups, contracts, agents as demoAgents, properties as demoProperties } from '@/lib/demo-data';
import { Header } from './properties-view';
import { Badge, Modal } from './ui';
import { Search, Phone, MessageSquare, Calendar, CheckCircle2, Clock, TrendingUp, Award, Sparkles } from 'lucide-react';
import { matchProperties } from '@/lib/matching/property-matcher';
import type { Property } from '@/lib/types';

type OwnerRow = { id: string; name: string; phone: string; notes?: string | null; propertiesCount?: number };
type AgentRow = { id: string; name: string };
type ApplicantRow = {
  id: string;
  name: string;
  phone: string;
  requestType: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  cities?: string[];
  districts?: string[];
  propertyTypes?: string[];
  minRooms?: number | null;
  requiredFeatures?: string[];
  urgency: number;
  status: string;
  notes?: string | null;
  agent?: AgentRow;
};

function Toolbar() {
  return (
    <div className="card mb-5 flex gap-3 p-4">
      <div className="relative flex-1">
        <Search className="absolute right-3 top-3 text-slate-400" size={18} />
        <input className="input pr-10" placeholder="جست‌وجو در فهرست..." />
      </div>
      <select className="input w-40"><option>همه وضعیت‌ها</option><option>فعال</option><option>در انتظار</option></select>
    </div>
  );
}

export function Owners() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<OwnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/owners').then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setRows(data);
      else setError(data.error || 'خطا در دریافت مالک‌ها');
    }).catch(() => setError('خطا در دریافت مالک‌ها')).finally(() => setLoading(false));
  }, []);

  async function addOwner(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const f = new FormData(e.currentTarget);
    const response = await fetch('/api/owners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: String(f.get('name') || ''), phone: String(f.get('phone') || ''),
        email: String(f.get('email') || '') || undefined, address: String(f.get('address') || '') || undefined,
        notes: String(f.get('notes') || '') || undefined,
      }),
    });
    const result = await response.json();
    if (!response.ok) { setError(result.error || 'ثبت مالک انجام نشد'); return; }
    setRows((current) => [{ id: String(result.id), name: result.name, phone: result.phone, notes: result.notes, propertiesCount: 0 }, ...current]);
    setOpen(false);
    e.currentTarget.reset();
  }

  return <>
    <Header title="مالک‌ها" sub="مدیریت اطلاعات، املاک و ارتباطات مالک‌ها" action={() => setOpen(true)} label="مالک جدید" />
    <Toolbar />
    {loading ? <div className="card p-8 text-center text-sm text-slate-500">در حال دریافت مالک‌ها...</div> :
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((o) => <div className="card p-5" key={o.id}>
        <div className="flex gap-3"><div className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{o.name[0]}</div><div><b>{o.name}</b><p className="mt-1 text-xs text-slate-500">مالک ثبت‌شده در CRM</p></div><Badge tone="green">فعال</Badge></div>
        <div className="my-4 rounded-xl bg-slate-50 p-3 text-sm"><Phone className="ml-2 inline" size={15} />{o.phone}</div>
        <p className="text-xs text-slate-500">{o.notes || 'یادداشتی ثبت نشده است.'}</p>
        <div className="mt-4 flex justify-between border-t pt-4 text-xs"><span>{o.propertiesCount || 0} ملک ثبت‌شده</span><button className="text-brand-700">مشاهده پرونده ←</button></div>
      </div>)}</div>}
    {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <Modal open={open} onClose={() => setOpen(false)} title="افزودن مالک"><form onSubmit={addOwner} className="grid gap-4 md:grid-cols-2">
      <div><label className="label">نام و نام خانوادگی</label><input required name="name" className="input" /></div>
      <div><label className="label">شماره تماس</label><input required name="phone" className="input" dir="ltr" /></div>
      <div><label className="label">ایمیل</label><input name="email" type="email" className="input" dir="ltr" /></div>
      <div><label className="label">آدرس</label><input name="address" className="input" /></div>
      <div className="md:col-span-2"><label className="label">یادداشت</label><textarea name="notes" className="input h-24 py-3" /></div>
      <button className="btn-primary md:col-start-2">ذخیره اطلاعات</button>
    </form></Modal>
  </>;
}

export function Applicants() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ApplicantRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [properties, setProperties] = useState<Property[]>(demoProperties);
  const [selected, setSelected] = useState<ApplicantRow | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/applicants').then((r) => r.json()),
      fetch('/api/agents').then((r) => r.json()),
      fetch('/api/properties').then((r) => r.json()),
    ]).then(([applicantData, agentData, propertyData]) => {
      if (Array.isArray(applicantData)) setRows(applicantData);
      if (Array.isArray(agentData)) setAgents(agentData);
      if (Array.isArray(propertyData)) setProperties(propertyData);
    }).catch(() => setError('خطا در دریافت اطلاعات متقاضی‌ها'));
  }, []);

  const matches = useMemo(() => selected ? matchProperties(selected, properties).slice(0, 6) : [], [selected, properties]);

  async function addApplicant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const f = new FormData(e.currentTarget);
    const payload = {
      name: String(f.get('name') || ''), phone: String(f.get('phone') || ''), requestType: String(f.get('requestType') || 'فروش'),
      budgetMin: Number(f.get('budgetMin')) || undefined, budgetMax: Number(f.get('budgetMax')) || undefined,
      cities: String(f.get('cities') || '').split('،').map((x) => x.trim()).filter(Boolean),
      districts: String(f.get('districts') || '').split('،').map((x) => x.trim()).filter(Boolean),
      propertyTypes: String(f.get('propertyTypes') || '').split('،').map((x) => x.trim()).filter(Boolean),
      minRooms: Number(f.get('minRooms')) || undefined,
      requiredFeatures: String(f.get('requiredFeatures') || '').split('،').map((x) => x.trim()).filter(Boolean),
      urgency: Number(f.get('urgency')) || 1, notes: String(f.get('notes') || '') || undefined, agentId: String(f.get('agentId') || '') || undefined,
    };
    const response = await fetch('/api/applicants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || 'ثبت متقاضی انجام نشد'); return; }
    setRows((current) => [result, ...current]);
    setOpen(false);
    e.currentTarget.reset();
  }

  function urgencyLabel(value: number) { return value >= 4 ? 'فوری' : value === 3 ? 'زیاد' : value === 2 ? 'متوسط' : 'کم'; }

  return <>
    <Header title="متقاضی‌ها" sub="نیازسنجی و پیشنهاد هوشمند ملک" action={() => setOpen(true)} label="متقاضی جدید" />
    <Toolbar />
    <div className="card table-wrap"><table className="data-table"><thead><tr><th>متقاضی</th><th>نوع درخواست</th><th>بودجه</th><th>فوریت</th><th>مشاور</th><th>پیشنهادها</th></tr></thead><tbody>
      {rows.map((a) => { const count = matchProperties(a, properties).length; return <tr key={a.id}><td><b>{a.name}</b><small className="block text-slate-500">{a.phone}</small></td><td>{a.requestType}</td><td>{a.budgetMax ? `تا ${a.budgetMax} میلیارد` : 'ثبت نشده'}</td><td><Badge tone={a.urgency >= 4 ? 'red' : a.urgency === 3 ? 'amber' : 'gray'}>{urgencyLabel(a.urgency)}</Badge></td><td>{a.agent?.name || '—'}</td><td><button onClick={() => setSelected(a)} className="inline-flex items-center gap-1 text-brand-700"><Sparkles size={15} />{count} ملک متناسب</button></td></tr>; })}
    </tbody></table></div>
    {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

    <Modal open={open} onClose={() => setOpen(false)} title="ثبت متقاضی جدید"><form onSubmit={addApplicant} className="grid gap-4 md:grid-cols-2">
      <div><label className="label">نام و نام خانوادگی</label><input required name="name" className="input" /></div>
      <div><label className="label">شماره تماس</label><input required name="phone" className="input" dir="ltr" /></div>
      <div><label className="label">نوع درخواست</label><select name="requestType" className="input"><option>فروش</option><option>اجاره</option><option>رهن و اجاره</option></select></div>
      <div><label className="label">فوریت</label><select name="urgency" className="input"><option value="4">فوری</option><option value="3">زیاد</option><option value="2">متوسط</option><option value="1">کم</option></select></div>
      <div><label className="label">حداقل بودجه (میلیارد)</label><input name="budgetMin" type="number" step="0.1" className="input" /></div>
      <div><label className="label">حداکثر بودجه (میلیارد)</label><input name="budgetMax" type="number" step="0.1" className="input" /></div>
      <div><label className="label">شهرها</label><input name="cities" defaultValue="تهران" className="input" placeholder="تهران، کرج" /></div>
      <div><label className="label">محله‌ها</label><input name="districts" className="input" placeholder="نیاوران، پاسداران" /></div>
      <div><label className="label">نوع ملک</label><input name="propertyTypes" className="input" placeholder="آپارتمان، ویلا" /></div>
      <div><label className="label">حداقل خواب</label><input name="minRooms" type="number" min="0" className="input" /></div>
      <div className="md:col-span-2"><label className="label">امکانات ضروری</label><input name="requiredFeatures" className="input" placeholder="پارکینگ، آسانسور، انباری" /></div>
      <div><label className="label">مشاور مسئول</label><select name="agentId" className="input">{agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
      <div className="md:col-span-2"><label className="label">یادداشت</label><textarea name="notes" className="input h-24 py-3" /></div>
      <button className="btn-primary md:col-start-2">ذخیره و محاسبه پیشنهادها</button>
    </form></Modal>

    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? `پیشنهادهای ${selected.name}` : 'پیشنهادهای متناسب'}>
      <div className="space-y-3">{matches.length ? matches.map((m) => <Link href={`/properties/${m.property.id}`} key={String(m.property.id)} className="block rounded-xl border p-4 transition hover:border-brand-300 hover:bg-brand-50/30">
        <div className="flex items-start justify-between gap-3"><div><b>{m.property.title}</b><p className="mt-1 text-xs text-slate-500">{m.property.district} · {m.property.area} متر · {m.property.price} میلیارد</p></div><Badge tone={m.score >= 75 ? 'green' : m.score >= 55 ? 'amber' : 'gray'}>{m.score}٪ تطابق</Badge></div>
        <div className="mt-3 flex flex-wrap gap-2">{m.reasons.map((reason) => <span key={reason} className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] text-slate-600">{reason}</span>)}</div>
      </Link>) : <div className="py-8 text-center text-sm text-slate-500">ملک مناسبی با حداقل امتیاز پیدا نشد.</div>}</div>
    </Modal>
  </>;
}

function SimpleForm({ open, close, title }: { open: boolean; close: () => void; title: string }) {
  return <Modal open={open} onClose={close} title={title}><form onSubmit={(e) => { e.preventDefault(); close(); }} className="grid gap-4 md:grid-cols-2">
    <div><label className="label">نام و نام خانوادگی</label><input required className="input" /></div><div><label className="label">شماره تماس</label><input required className="input" dir="ltr" /></div><div><label className="label">مشاور مسئول</label><select className="input">{demoAgents.map((x) => <option key={x.name}>{x.name}</option>)}</select></div><div><label className="label">وضعیت</label><select className="input"><option>فعال</option><option>در انتظار</option></select></div><div className="md:col-span-2"><label className="label">یادداشت</label><textarea className="input h-24 py-3" /></div><button className="btn-primary md:col-start-2">ذخیره اطلاعات</button>
  </form></Modal>;
}

export function Followups(){const[tab,setTab]=useState('امروز');const[open,setOpen]=useState(false);return <><Header title="پیگیری‌ها و وظایف" sub="برنامه روزانه تیم و یادآوری ارتباطات" action={()=>setOpen(true)} label="پیگیری جدید"/><div className="mb-5 flex gap-2 overflow-auto">{['امروز','عقب‌افتاده','آینده','همه'].map(x=><button onClick={()=>setTab(x)} className={tab===x?'btn-primary':'btn-secondary'} key={x}>{x}</button>)}</div><div className="grid gap-4 lg:grid-cols-3"><div className="space-y-3 lg:col-span-2">{followups.map(f=><div className="card flex items-center gap-4 p-4" key={f.id}><button className="grid h-10 w-10 place-items-center rounded-full border-2 border-slate-200 text-slate-300 hover:border-brand-500 hover:text-brand-500"><CheckCircle2 size={20}/></button><div><div className="flex items-center gap-2"><b>{f.title}</b><Badge tone={f.priority==='عقب‌افتاده'?'red':f.priority==='فوری'?'amber':'gray'}>{f.type}</Badge></div><p className="mt-1 text-xs text-slate-500"><Clock className="ml-1 inline" size={13}/>{f.time} · {f.agent}</p></div><button className="btn-secondary mr-auto hidden sm:flex"><MessageSquare size={16}/>یادداشت</button></div>)}</div><div className="card p-5"><h2 className="font-bold">خلاصه امروز</h2><div className="mt-5 space-y-4">{[['انجام‌شده','۸','green'],['باقی‌مانده','۳','amber'],['عقب‌افتاده','۱','red']].map(([x,n,c])=><div className="flex justify-between" key={x}><span className="text-sm text-slate-500">{x}</span><Badge tone={c as any}>{n}</Badge></div>)}</div><div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm text-brand-900"><Calendar className="mb-2"/><b>بازدید بعدی</b><p className="mt-1 text-xs">ویلای لواسان، ساعت ۱۶:۰۰</p></div></div></div><SimpleForm open={open} close={()=>setOpen(false)} title="ایجاد پیگیری جدید"/></>}
export function Contracts(){return <><Header title="قراردادها" sub="مدیریت قراردادها، کمیسیون‌ها و پرداخت‌ها"/><div className="mb-5 grid gap-4 md:grid-cols-3">{[['ارزش قراردادهای ماه','۴۱.۲ میلیارد'],['کمیسیون این ماه','۵۲۲ میلیون'],['در انتظار امضا','۳ قرارداد']].map(([x,n])=><div className="card p-5" key={x}><p className="text-sm text-slate-500">{x}</p><b className="mt-2 block text-xl text-brand-700">{n}</b></div>)}</div><Toolbar/><div className="card table-wrap"><table className="data-table"><thead><tr><th>شماره</th><th>ملک / طرف قرارداد</th><th>نوع</th><th>مبلغ</th><th>کمیسیون</th><th>تاریخ</th><th>وضعیت</th></tr></thead><tbody>{contracts.map(c=><tr key={c.id}><td className="text-slate-500">{c.id}</td><td><b>{c.property}</b><small className="block text-slate-500">{c.party}</small></td><td>{c.type}</td><td>{c.amount}</td><td>{c.commission}</td><td>{c.date}</td><td><Badge tone={c.status==='تکمیل شده'?'green':'amber'}>{c.status}</Badge></td></tr>)}</tbody></table></div></>}
export function Reports(){return <><Header title="گزارش‌ها و عملکرد" sub="تحلیل عملکرد تیم فروش در آذر ۱۴۰۳"/><div className="grid gap-4 md:grid-cols-3">{[['نرخ تبدیل','۲۳.۸٪','۴.۲٪ رشد'],['میانگین زمان معامله','۱۸ روز','۳ روز سریع‌تر'],['رضایت مشتری','۴.۸ از ۵','۹۶٪ مثبت']].map(([x,n,d])=><div className="card p-6" key={x}><TrendingUp className="mb-4 text-brand-600"/><p className="text-sm text-slate-500">{x}</p><b className="my-2 block text-2xl">{n}</b><small className="text-brand-700">{d}</small></div>)}</div><div className="card mt-5 p-6"><h2 className="mb-5 font-bold">رتبه‌بندی مشاوران</h2>{demoAgents.map((a,i)=><div className="flex items-center gap-4 border-b py-4 last:border-0" key={a.name}><span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 font-bold">{i+1}</span>{i===0&&<Award className="text-amber-500"/>}<div><b>{a.name}</b><p className="text-xs text-slate-500">{a.deals} قرارداد موفق</p></div><div className="mr-auto text-left"><b>{a.value} میلیارد</b><p className="text-xs text-slate-500">نرخ تبدیل {a.rate}٪</p></div></div>)}</div></>}
