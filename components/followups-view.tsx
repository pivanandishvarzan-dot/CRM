'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, Clock3, MessageSquare, Plus } from 'lucide-react';
import { Header } from './properties-view';
import { Badge, Modal } from './ui';

type Agent = { id: string; name: string };
type EntityRef = { id: string; name?: string; title?: string } | null;
type Followup = {
  id: string; title: string; type: string; scheduledAt: string; priority: number; completed: boolean;
  description?: string | null; assignee?: Agent | null; owner?: EntityRef; applicant?: EntityRef; property?: EntityRef;
};
type Lookup = { id: string; label: string };

function startOfDay(date: Date) { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; }
function endOfDay(date: Date) { const d = new Date(date); d.setHours(23, 59, 59, 999); return d; }
function priorityTone(priority: number, overdue: boolean): 'red'|'amber'|'gray'|'green' { if (overdue || priority >= 4) return 'red'; if (priority === 3) return 'amber'; return 'gray'; }
function formatFaDate(value: string) { return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }

export default function FollowupsView() {
  const [tab, setTab] = useState<'امروز'|'عقب‌افتاده'|'آینده'|'همه'>('امروز');
  const [rows, setRows] = useState<Followup[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [owners, setOwners] = useState<Lookup[]>([]);
  const [applicants, setApplicants] = useState<Lookup[]>([]);
  const [properties, setProperties] = useState<Lookup[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/followups').then(r => r.json()), fetch('/api/agents').then(r => r.json()),
      fetch('/api/owners').then(r => r.json()), fetch('/api/applicants').then(r => r.json()), fetch('/api/properties').then(r => r.json()),
    ]).then(([followupData, agentData, ownerData, applicantData, propertyData]) => {
      if (Array.isArray(followupData)) setRows(followupData);
      if (Array.isArray(agentData)) setAgents(agentData);
      if (Array.isArray(ownerData)) setOwners(ownerData.map(x => ({ id: String(x.id), label: x.name })));
      if (Array.isArray(applicantData)) setApplicants(applicantData.map(x => ({ id: String(x.id), label: x.name })));
      if (Array.isArray(propertyData)) setProperties(propertyData.map(x => ({ id: String(x.id), label: x.title })));
    }).catch(() => setError('خطا در دریافت اطلاعات پیگیری‌ها'));
  }, []);

  const now = new Date(); const todayStart = startOfDay(now); const todayEnd = endOfDay(now);
  const filtered = useMemo(() => rows.filter(item => { const date = new Date(item.scheduledAt); if (tab === 'امروز') return date >= todayStart && date <= todayEnd; if (tab === 'عقب‌افتاده') return !item.completed && date < todayStart; if (tab === 'آینده') return date > todayEnd; return true; }), [rows, tab]);
  const summary = useMemo(() => ({ done: rows.filter(x => x.completed && new Date(x.scheduledAt) >= todayStart && new Date(x.scheduledAt) <= todayEnd).length, remaining: rows.filter(x => !x.completed && new Date(x.scheduledAt) >= todayStart && new Date(x.scheduledAt) <= todayEnd).length, overdue: rows.filter(x => !x.completed && new Date(x.scheduledAt) < todayStart).length }), [rows]);
  const nextVisit = rows.filter(x => !x.completed && x.type === 'بازدید' && new Date(x.scheduledAt) >= now).sort((a,b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))[0];

  async function toggleCompleted(item: Followup) {
    const response = await fetch(`/api/followups/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !item.completed }) });
    if (!response.ok) { setError('به‌روزرسانی پیگیری انجام نشد'); return; }
    setRows(current => current.map(x => x.id === item.id ? { ...x, completed: !x.completed } : x));
  }

  async function addFollowup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const payload = {
      title: String(f.get('title') || ''), type: String(f.get('type') || 'تماس'), scheduledAt: String(f.get('scheduledAt') || ''),
      priority: Number(f.get('priority')) || 2, assigneeId: String(f.get('assigneeId') || '') || undefined,
      ownerId: String(f.get('ownerId') || '') || undefined, applicantId: String(f.get('applicantId') || '') || undefined,
      propertyId: String(f.get('propertyId') || '') || undefined, description: String(f.get('description') || '') || undefined,
    };
    const response = await fetch('/api/followups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json(); if (!response.ok) { setError(result.error || 'ثبت پیگیری انجام نشد'); return; }
    setRows(current => [...current, result]); setOpen(false); e.currentTarget.reset();
  }

  return <>
    <Header title="پیگیری‌ها و تقویم" sub="تماس‌ها، بازدیدها، جلسات و وظایف تیم" action={() => setOpen(true)} label="پیگیری جدید" />
    <div className="mb-5 flex gap-2 overflow-auto">{(['امروز','عقب‌افتاده','آینده','همه'] as const).map(x => <button onClick={() => setTab(x)} className={tab===x?'btn-primary':'btn-secondary'} key={x}>{x}</button>)}</div>
    <div className="grid gap-4 lg:grid-cols-3"><div className="space-y-3 lg:col-span-2">
      {filtered.map(item => { const overdue = !item.completed && new Date(item.scheduledAt) < todayStart; return <div className={`card flex items-center gap-4 p-4 ${item.completed ? 'opacity-60' : ''}`} key={item.id}>
        <button onClick={() => toggleCompleted(item)} className={`grid h-10 w-10 place-items-center rounded-full border-2 ${item.completed ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 text-slate-300 hover:border-brand-500 hover:text-brand-500'}`}><CheckCircle2 size={20}/></button>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className={item.completed ? 'line-through' : ''}>{item.title}</b><Badge tone={priorityTone(item.priority, overdue)}>{overdue ? 'عقب‌افتاده' : item.type}</Badge></div><p className="mt-1 text-xs text-slate-500"><Clock3 className="ml-1 inline" size={13}/>{formatFaDate(item.scheduledAt)} · {item.assignee?.name || 'بدون مسئول'}</p><div className="mt-2 flex flex-wrap gap-2 text-xs">{item.property && <Link href={`/properties/${item.property.id}`} className="text-brand-700">ملک: {item.property.title}</Link>}{item.owner && <span className="text-slate-500">مالک: {item.owner.name}</span>}{item.applicant && <span className="text-slate-500">متقاضی: {item.applicant.name}</span>}</div></div>
        <button className="btn-secondary hidden sm:flex"><MessageSquare size={16}/>یادداشت</button>
      </div>; })}
      {!filtered.length && <div className="card p-10 text-center text-sm text-slate-500">در این بخش پیگیری‌ای وجود ندارد.</div>}
    </div><div className="card p-5"><h2 className="font-bold">خلاصه امروز</h2><div className="mt-5 space-y-4"><div className="flex justify-between"><span className="text-sm text-slate-500">انجام‌شده</span><Badge tone="green">{summary.done}</Badge></div><div className="flex justify-between"><span className="text-sm text-slate-500">باقی‌مانده</span><Badge tone="amber">{summary.remaining}</Badge></div><div className="flex justify-between"><span className="text-sm text-slate-500">عقب‌افتاده</span><Badge tone="red">{summary.overdue}</Badge></div></div>{nextVisit && <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm text-brand-900"><Calendar className="mb-2"/><b>بازدید بعدی</b><p className="mt-1 text-xs">{nextVisit.title}</p><p className="mt-1 text-xs">{formatFaDate(nextVisit.scheduledAt)}</p></div>}</div></div>
    {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <Modal open={open} onClose={() => setOpen(false)} title="ایجاد پیگیری جدید"><form onSubmit={addFollowup} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2"><label className="label">عنوان پیگیری</label><input required name="title" className="input" placeholder="مثلاً تماس با متقاضی برای هماهنگی بازدید"/></div>
      <div><label className="label">نوع</label><select name="type" className="input">{['تماس','پیام','جلسه','بازدید','یادآوری','وظیفه'].map(x => <option key={x}>{x}</option>)}</select></div>
      <div><label className="label">اولویت</label><select name="priority" className="input"><option value="4">فوری</option><option value="3">زیاد</option><option value="2">متوسط</option><option value="1">کم</option></select></div>
      <div><label className="label">تاریخ و ساعت</label><input required name="scheduledAt" type="datetime-local" className="input"/></div>
      <div><label className="label">مشاور مسئول</label><select name="assigneeId" className="input"><option value="">انتخاب نشده</option>{agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
      <div><label className="label">ملک مرتبط</label><select name="propertyId" className="input"><option value="">بدون ملک</option>{properties.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</select></div>
      <div><label className="label">مالک مرتبط</label><select name="ownerId" className="input"><option value="">بدون مالک</option>{owners.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</select></div>
      <div><label className="label">متقاضی مرتبط</label><select name="applicantId" className="input"><option value="">بدون متقاضی</option>{applicants.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</select></div>
      <div className="md:col-span-2"><label className="label">توضیحات</label><textarea name="description" className="input h-24 py-3"/></div><button className="btn-primary md:col-start-2"><Plus size={17}/>ثبت پیگیری</button>
    </form></Modal>
  </>;
}
