'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Building2,LayoutDashboard,Users,UserRoundSearch,PhoneCall,CalendarDays,FileSignature,BarChart3,Settings,Search,Bell,Menu,X,Plus,ChevronLeft,Command} from 'lucide-react';
import {useState} from 'react';

const nav=[['/','داشبورد',LayoutDashboard],['/properties','ملک‌ها',Building2],['/owners','مالک‌ها',Users],['/applicants','متقاضی‌ها',UserRoundSearch],['/followups','پیگیری‌ها',PhoneCall],['/followups?tab=calendar','جلسات و بازدیدها',CalendarDays],['/contracts','قراردادها',FileSignature],['/reports','گزارش‌ها',BarChart3],['/settings','تنظیمات',Settings]] as const;

export default function Shell({children}:{children:React.ReactNode}){
  const path=usePathname();
  const[open,setOpen]=useState(false);
  const active=(href:string)=>href==='/'?path==='/':path.startsWith(href.split('?')[0]);
  return <div className="min-h-screen bg-transparent">
    <aside className={`fixed inset-y-0 right-0 z-40 w-[280px] border-l border-white/10 bg-brand-950 text-white shadow-float transition-transform duration-300 lg:translate-x-0 ${open?'translate-x-0':'translate-x-full'}`}>
      <div className="flex h-24 items-center gap-3 border-b border-white/10 px-6">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-brand-900 shadow-soft"><Building2 size={23}/></div>
        <div><b className="text-lg tracking-tight">خانه‌یار</b><p className="mt-0.5 text-[11px] text-brand-200">مرکز فرماندهی فروش املاک</p></div>
        <button onClick={()=>setOpen(false)} className="mr-auto rounded-xl p-2 text-brand-100 hover:bg-white/10 lg:hidden"><X size={20}/></button>
      </div>
      <div className="px-4 py-5"><p className="mb-3 px-3 text-[10px] font-bold tracking-widest text-brand-300">فضای کاری</p><nav className="space-y-1.5">{nav.map(([href,label,Icon])=><Link key={label} onClick={()=>setOpen(false)} href={href} className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition ${active(href)?'bg-white font-bold text-brand-950 shadow-soft':'text-brand-100 hover:bg-white/10 hover:text-white'}`}><Icon size={18}/><span>{label}</span><ChevronLeft size={15} className={`mr-auto transition ${active(href)?'opacity-50':'opacity-0 group-hover:opacity-50'}`}/></Link>)}</nav></div>
      <div className="absolute inset-x-4 bottom-5 rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-100 font-extrabold text-brand-900">م</div><div className="min-w-0 text-xs"><b className="block truncate">مهدی اکبری</b><p className="mt-1 text-brand-200">مدیر آژانس · نمایشی</p></div><Settings size={17} className="mr-auto text-brand-200"/></div></div>
    </aside>
    {open&&<button aria-label="بستن منو" onClick={()=>setOpen(false)} className="fixed inset-0 z-30 bg-brand-950/40 backdrop-blur-sm lg:hidden"/>}
    <main className="mobile-pad lg:mr-[280px]">
      <header className="sticky top-0 z-20 flex h-20 items-center gap-3 border-b border-ink-100/80 bg-[#f4f7f5]/90 px-4 backdrop-blur-xl md:px-7 xl:px-10">
        <button onClick={()=>setOpen(true)} aria-label="منو" className="rounded-2xl border border-ink-100 bg-white p-2.5 text-ink-700 shadow-soft lg:hidden"><Menu size={20}/></button>
        <div className="relative hidden w-full max-w-lg md:block"><Search className="absolute right-4 top-3 text-ink-500" size={18}/><input className="input bg-white/80 pr-11 pl-20" placeholder="جست‌وجوی ملک، مالک یا متقاضی..."/><span className="absolute left-3 top-2.5 hidden items-center gap-1 rounded-lg border border-ink-100 bg-ink-50 px-2 py-1 text-[10px] text-ink-500 xl:flex"><Command size={11}/> K</span></div>
        <div className="mr-auto flex items-center gap-2"><span className="hidden badge border border-brand-100 bg-brand-50 text-brand-700 sm:inline-flex">حالت نمایشی</span><button aria-label="اعلان‌ها" className="relative grid h-11 w-11 place-items-center rounded-2xl border border-ink-100 bg-white text-ink-700 shadow-soft transition hover:-translate-y-0.5"><Bell size={19}/><i className="absolute left-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"/></button><Link href="/properties" className="btn-primary hidden sm:inline-flex"><Plus size={17}/>ثبت ملک</Link></div>
      </header>
      <div className="p-4 md:p-7 xl:p-10">{children}</div>
    </main>
    <nav className="fixed inset-x-3 bottom-3 z-30 flex h-[68px] items-center justify-around rounded-3xl border border-white/80 bg-white/95 px-2 shadow-float backdrop-blur lg:hidden">{nav.slice(0,4).map(([href,label,Icon])=><Link href={href} key={href} className={`flex min-w-12 flex-col items-center gap-1 text-[10px] font-semibold ${active(href)?'text-brand-700':'text-ink-500'}`}><Icon size={19}/>{label}</Link>)}<Link aria-label="ثبت ملک" href="/properties" className="-mt-8 grid h-13 w-13 place-items-center rounded-2xl bg-brand-800 p-3 text-white shadow-float"><Plus/></Link></nav>
  </div>;
}
