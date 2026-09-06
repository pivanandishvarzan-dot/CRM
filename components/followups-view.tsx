'use client';

import {useEffect,useMemo,useState} from 'react';
import type {FormEvent} from 'react';
import {useSearchParams} from 'next/navigation';
import {Header} from './properties-view';
import {Badge,Modal} from './ui';
import {
  AlertTriangle,CalendarDays,CheckCircle2,ChevronLeft,ChevronRight,Clock3,
  Loader2,MapPin,MessageCircle,Phone,Plus,Trash2,Users
} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';

type Followup={id:string;title:string;type:string;scheduledAt:string;time:string;priority:string;completed:boolean;agent:string;description:string};

const typeLabels:Record<string,string>={CALL:'تماس',MESSAGE:'پیام',MEETING:'جلسه',VISIT:'بازدید',REMINDER:'یادآوری',TASK:'وظیفه'};
const typeLabel=(type:string)=>typeLabels[type]??type;
const typeIcon=(type:string):LucideIcon=>{
  const normalized=typeLabel(type);
  if(normalized==='تماس')return Phone;
  if(normalized==='پیام')return MessageCircle;
  if(normalized==='بازدید')return MapPin;
  return Users;
};
const sameDay=(a:Date,b:Date)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const errorMessage=(error:unknown,fallback:string)=>error instanceof Error?error.message:fallback;

export default function FollowupsView(){
  const search=useSearchParams();
  const[mode,setMode]=useState(search.get('tab')==='calendar'?'calendar':'tasks');
  const[tab,setTab]=useState('امروز');
  const[open,setOpen]=useState(false);
  const[data,setData]=useState<Followup[]>([]);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[busyId,setBusyId]=useState<string|null>(null);
  const[error,setError]=useState('');

  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        const r=await fetch('/api/followups',{cache:'no-store'});
        const j=await r.json();
        if(!r.ok)throw new Error(j.error||'خطا در دریافت پیگیری‌ها');
        if(active)setData(j.data);
      }catch(e){if(active)setError(errorMessage(e,'خطا در دریافت پیگیری‌ها'))}
      finally{if(active)setLoading(false)}
    })();
    return()=>{active=false};
  },[]);

  const today=new Date();
  const start=new Date(today.getFullYear(),today.getMonth(),today.getDate()).getTime();
  const end=start+86400000;
  const filtered=useMemo(()=>data.filter(f=>{
    const t=new Date(f.scheduledAt).getTime();
    if(tab==='امروز')return t>=start&&t<end;
    if(tab==='عقب‌افتاده')return t<start&&!f.completed;
    if(tab==='آینده')return t>=end&&!f.completed;
    return true;
  }),[data,tab,start,end]);
  const doneToday=data.filter(f=>{const t=new Date(f.scheduledAt).getTime();return t>=start&&t<end&&f.completed}).length;
  const remainingToday=data.filter(f=>{const t=new Date(f.scheduledAt).getTime();return t>=start&&t<end&&!f.completed}).length;
  const overdue=data.filter(f=>new Date(f.scheduledAt).getTime()<start&&!f.completed).length;

  async function toggle(f:Followup){
    if(busyId)return;
    setError('');setBusyId(f.id);
    try{
      const r=await fetch(`/api/followups/${encodeURIComponent(f.id)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({completed:!f.completed})});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'خطا در به‌روزرسانی پیگیری');
      setData(x=>x.map(i=>i.id===f.id?j.data:i));
    }catch(e){setError(errorMessage(e,'خطا در به‌روزرسانی پیگیری'))}
    finally{setBusyId(null)}
  }

  async function del(id:string){
    if(busyId||!confirm('پیگیری حذف شود؟'))return;
    setError('');setBusyId(id);
    try{
      const r=await fetch(`/api/followups/${encodeURIComponent(id)}`,{method:'DELETE'});
      if(!r.ok){const j=await r.json();throw new Error(j.error||'خطا در حذف پیگیری')}
      setData(x=>x.filter(i=>i.id!==id));
    }catch(e){setError(errorMessage(e,'خطا در حذف پیگیری'))}
    finally{setBusyId(null)}
  }

  async function add(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(saving)return;
    setError('');setSaving(true);
    const form=e.currentTarget,f=new FormData(form);
    try{
      const r=await fetch('/api/followups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:f.get('title'),type:f.get('type'),scheduledAt:f.get('scheduledAt'),priority:Number(f.get('priority'))||1,description:f.get('description')})});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'خطا در ثبت پیگیری');
      setData(x=>[j.data,...x]);setOpen(false);form.reset();
    }catch(e){setError(errorMessage(e,'خطا در ثبت پیگیری'))}
    finally{setSaving(false)}
  }

  return <>
    <Header title="پیگیری‌ها و برنامه کاری" sub="تماس‌ها، جلسات، بازدیدها و وظایف تیم فروش" action={()=>setOpen(true)} label="پیگیری جدید"/>
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Stat icon={Clock3} label="باقی‌مانده امروز" value={remainingToday} tone="brand"/><Stat icon={CheckCircle2} label="انجام‌شده امروز" value={doneToday} tone="brand"/><Stat icon={AlertTriangle} label="عقب‌افتاده" value={overdue} tone="accent"/></div>
    {error&&<div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="card mb-5 flex flex-wrap items-center justify-between gap-3 p-3"><div className="flex rounded-2xl bg-ink-50 p-1"><button onClick={()=>setMode('tasks')} className={mode==='tasks'?'btn-primary':'btn'}><CheckCircle2 size={16}/>فهرست کارها</button><button onClick={()=>setMode('calendar')} className={mode==='calendar'?'btn-primary':'btn'}><CalendarDays size={16}/>تقویم</button></div>{mode==='tasks'&&<div className="flex gap-2 overflow-auto">{['امروز','عقب‌افتاده','آینده','همه'].map(x=><button onClick={()=>setTab(x)} className={`rounded-xl px-3 py-2 text-xs font-bold transition ${tab===x?'bg-brand-50 text-brand-700':'text-ink-500 hover:bg-ink-50'}`} key={x}>{x}</button>)}</div>}</div>
    {loading?<div className="card flex items-center justify-center gap-2 py-20 text-ink-500"><Loader2 className="animate-spin"/>در حال دریافت برنامه...</div>:mode==='tasks'?<div className="grid gap-5 xl:grid-cols-3"><div className="space-y-3 xl:col-span-2">{!filtered.length&&<div className="card p-10 text-center text-sm text-ink-500">پیگیری‌ای در این بخش وجود ندارد.</div>}{filtered.map(f=>{const Icon=typeIcon(f.type);const busy=busyId===f.id;return <article className={`card flex items-start gap-4 p-4 transition hover:-translate-y-0.5 ${f.completed?'opacity-60':''}`} key={f.id}><button disabled={busy} onClick={()=>toggle(f)} className={`mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 transition disabled:cursor-wait disabled:opacity-60 ${f.completed?'border-brand-500 bg-brand-50 text-brand-700':'border-ink-200 text-ink-300 hover:border-brand-300'}`}>{busy?<Loader2 className="animate-spin" size={18}/>:<CheckCircle2 size={20}/>}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className={`text-sm text-ink-900 ${f.completed?'line-through':''}`}>{f.title}</b><Badge tone={f.priority==='فوری'?'red':f.priority==='مهم'?'amber':'gray'}>{f.priority||'عادی'}</Badge></div><div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-500"><span className="flex items-center gap-1"><Icon size={14}/>{typeLabel(f.type)}</span><span className="flex items-center gap-1"><Clock3 size={14}/>{f.time}</span><span>{f.agent}</span></div>{f.description&&<p className="mt-2 text-xs leading-6 text-ink-500">{f.description}</p>}</div><button disabled={busy} onClick={()=>del(f.id)} className="rounded-xl p-2 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-wait disabled:opacity-50"><Trash2 size={16}/></button></article>})}</div><aside className="space-y-4"><div className="card p-5"><h2 className="font-extrabold text-ink-900">تمرکز امروز</h2><p className="mt-1 text-xs text-ink-500">وضعیت اجرای برنامه روزانه</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand-600" style={{width:`${doneToday+remainingToday?Math.round(doneToday/(doneToday+remainingToday)*100):0}%`}}/></div><div className="mt-3 flex justify-between text-xs"><span className="text-ink-500">پیشرفت</span><b className="text-brand-700">{doneToday+remainingToday?Math.round(doneToday/(doneToday+remainingToday)*100):0}٪</b></div></div><div className="rounded-3xl bg-brand-950 p-5 text-white"><CalendarDays size={22} className="text-brand-300"/><h3 className="mt-4 font-extrabold">برنامه‌ریزی بهتر، فروش منظم‌تر</h3><p className="mt-2 text-xs leading-6 text-brand-200">بازدیدها و تماس‌های بعدی را همان لحظه ثبت کنید تا هیچ فرصت فروش از دست نرود.</p><button onClick={()=>setOpen(true)} className="mt-4 flex items-center gap-1 text-xs font-bold text-white"><Plus size={14}/>ایجاد پیگیری</button></div></aside></div>:<CalendarView data={data}/>} 
    <FollowupForm open={open} close={()=>{if(!saving)setOpen(false)}} submit={add} saving={saving}/>
  </>;
}

function CalendarView({data}:{data:Followup[]}){
  const[view,setView]=useState(()=>new Date());
  const first=new Date(view.getFullYear(),view.getMonth(),1);
  const saturdayIndex=(first.getDay()+1)%7;
  const gridStart=new Date(view.getFullYear(),view.getMonth(),1-saturdayIndex);
  const days=Array.from({length:42},(_,i)=>new Date(gridStart.getFullYear(),gridStart.getMonth(),gridStart.getDate()+i));
  const monthLabel=new Intl.DateTimeFormat('fa-IR-u-ca-gregory',{month:'long',year:'numeric'}).format(view);
  const today=new Date();
  return <div className="card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-5"><div><h2 className="font-extrabold text-ink-900">تقویم پیگیری‌ها</h2><p className="mt-1 text-xs text-ink-500">نمای ماهانه واقعی برنامه تیم</p></div><div className="flex items-center gap-2"><button aria-label="ماه قبل" onClick={()=>setView(v=>new Date(v.getFullYear(),v.getMonth()-1,1))} className="rounded-xl border border-ink-100 p-2 text-ink-500"><ChevronRight size={17}/></button><button onClick={()=>setView(new Date())} className="min-w-28 text-sm font-extrabold text-ink-800">{monthLabel}</button><button aria-label="ماه بعد" onClick={()=>setView(v=>new Date(v.getFullYear(),v.getMonth()+1,1))} className="rounded-xl border border-ink-100 p-2 text-ink-500"><ChevronLeft size={17}/></button></div></div><div className="grid grid-cols-7 border-b border-ink-100 bg-ink-50 text-center text-[11px] font-bold text-ink-500">{['ش','ی','د','س','چ','پ','ج'].map(x=><div className="p-3" key={x}>{x}</div>)}</div><div className="grid grid-cols-7">{days.map(d=>{const items=data.filter(f=>sameDay(new Date(f.scheduledAt),d)).sort((a,b)=>new Date(a.scheduledAt).getTime()-new Date(b.scheduledAt).getTime());const inMonth=d.getMonth()===view.getMonth();const isToday=sameDay(d,today);return <div key={d.toISOString()} className={`min-h-28 border-b border-l border-ink-100 p-2 ${isToday?'bg-brand-50/70':''} ${!inMonth?'bg-ink-50/50':''}`}><span className={`grid h-7 w-7 place-items-center rounded-full text-xs ${isToday?'bg-brand-700 font-bold text-white':inMonth?'text-ink-700':'text-ink-300'}`}>{new Intl.NumberFormat('fa-IR').format(d.getDate())}</span><div className="mt-2 space-y-1">{items.slice(0,2).map(x=><div key={x.id} className={`truncate rounded-lg px-2 py-1 text-[10px] font-semibold ${x.completed?'bg-ink-100 text-ink-400 line-through':'bg-brand-100 text-brand-800'}`}>{x.time} {x.title}</div>)}{items.length>2&&<div className="px-1 text-[10px] font-bold text-ink-500">+{new Intl.NumberFormat('fa-IR').format(items.length-2)} مورد</div>}</div></div>})}</div></div>;
}

function Stat({icon:Icon,label,value,tone}:{icon:LucideIcon;label:string;value:number;tone:string}){return <div className="card flex items-center gap-3 p-4"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone==='accent'?'bg-accent-50 text-accent-600':'bg-brand-50 text-brand-700'}`}><Icon size={19}/></span><div><p className="text-xs text-ink-500">{label}</p><b className="mt-1 block text-xl text-ink-900">{value}</b></div></div>}

function FollowupForm({open,close,submit,saving}:{open:boolean;close:()=>void;submit:(e:FormEvent<HTMLFormElement>)=>void;saving:boolean}){return <Modal open={open} onClose={close} title="ایجاد پیگیری جدید"><form onSubmit={submit} className="grid gap-4 md:grid-cols-2"><div className="md:col-span-2"><label className="label">عنوان پیگیری</label><input required name="title" className="input" placeholder="مثلاً تماس با مالک فایل پاسداران"/></div><div><label className="label">نوع فعالیت</label><select name="type" className="input"><option value="CALL">تماس</option><option value="MESSAGE">پیام</option><option value="MEETING">جلسه</option><option value="VISIT">بازدید</option><option value="REMINDER">یادآوری</option><option value="TASK">وظیفه</option></select></div><div><label className="label">اولویت</label><select name="priority" className="input"><option value="1">عادی</option><option value="2">مهم</option><option value="3">فوری</option></select></div><div className="md:col-span-2"><label className="label">تاریخ و ساعت</label><input required name="scheduledAt" type="datetime-local" className="input"/></div><div className="md:col-span-2"><label className="label">توضیحات</label><textarea name="description" className="input min-h-24 py-3" placeholder="جزئیات پیگیری..."/></div><div className="md:col-span-2 flex justify-end gap-2 border-t border-ink-100 pt-4"><button type="button" disabled={saving} onClick={close} className="btn-secondary disabled:opacity-50">انصراف</button><button disabled={saving} className="btn-primary disabled:cursor-wait disabled:opacity-70">{saving?<><Loader2 className="animate-spin" size={16}/>در حال ثبت...</>:'ثبت پیگیری'}</button></div></form></Modal>}
