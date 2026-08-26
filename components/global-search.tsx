'use client';

import Link from 'next/link';
import { Search, Building2, Users, UserRoundSearch, FileSignature, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Result = { id: string; type: 'PROPERTY'|'OWNER'|'APPLICANT'|'CONTRACT'; title: string; subtitle: string; href: string };
const config = {
  PROPERTY: { label: 'ملک', icon: Building2 },
  OWNER: { label: 'مالک', icon: Users },
  APPLICANT: { label: 'متقاضی', icon: UserRoundSearch },
  CONTRACT: { label: 'قرارداد', icon: FileSignature },
} as const;

export default function GlobalSearch() {
  const [query,setQuery]=useState(''); const [results,setResults]=useState<Result[]>([]); const [loading,setLoading]=useState(false); const [open,setOpen]=useState(false); const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
  function change(value:string){setQuery(value);if(timer.current)clearTimeout(timer.current);if(value.trim().length<2){setResults([]);setOpen(false);return}setLoading(true);setOpen(true);timer.current=setTimeout(async()=>{try{const r=await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`);const j=await r.json();setResults(Array.isArray(j.data)?j.data:[])}catch{setResults([])}finally{setLoading(false)}},250)}
  return <div className="relative w-full max-w-md hidden md:block"><Search className="absolute right-3 top-2.5 text-slate-400" size={20}/><input value={query} onChange={e=>change(e.target.value)} onFocus={()=>query.trim().length>=2&&setOpen(true)} className="input pr-10" placeholder="جست‌وجوی ملک، مالک، متقاضی یا قرارداد..."/>{open&&<div className="absolute top-12 z-50 w-full overflow-hidden rounded-2xl border bg-white shadow-xl"><div className="max-h-[420px] overflow-y-auto">{loading&&<div className="flex items-center justify-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="animate-spin" size={16}/>در حال جست‌وجو...</div>}{!loading&&results.map(item=>{const {icon:Icon,label}=config[item.type];return <Link href={item.href} key={`${item.type}-${item.id}`} onClick={()=>{setOpen(false);setQuery('')}} className="flex items-start gap-3 border-b p-3 hover:bg-slate-50"><div className="rounded-lg bg-brand-50 p-2 text-brand-700"><Icon size={17}/></div><div className="min-w-0"><div className="flex items-center gap-2"><b className="truncate text-sm">{item.title}</b><span className="badge bg-slate-100 text-[10px] text-slate-600">{label}</span></div><p className="mt-1 truncate text-xs text-slate-500">{item.subtitle}</p></div></Link>})}{!loading&&!results.length&&query.trim().length>=2&&<div className="p-6 text-center text-sm text-slate-500">نتیجه‌ای پیدا نشد.</div>}</div></div>}</div>;
}
