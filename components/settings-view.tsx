'use client';

import { useEffect, useState } from 'react';
import { BellRing, Bot, Save, TimerReset } from 'lucide-react';

type Rule={id:string;key:string;name:string;description?:string|null;type:string;enabled:boolean;thresholdDays:number;action:string;priority:number};

export default function SettingsView(){
  const[rules,setRules]=useState<Rule[]>([]);const[error,setError]=useState('');const[saving,setSaving]=useState('');
  useEffect(()=>{fetch('/api/automation-rules').then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error||'خطا');setRules(j.data||[])}).catch(e=>setError(e.message||'خطا در دریافت تنظیمات'))},[]);
  function patch(id:string,next:Partial<Rule>){setRules(x=>x.map(r=>r.id===id?{...r,...next}:r))}
  async function save(rule:Rule){setSaving(rule.id);setError('');try{const r=await fetch('/api/automation-rules',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:rule.id,enabled:rule.enabled,thresholdDays:rule.thresholdDays,action:rule.action,priority:rule.priority})});const j=await r.json();if(!r.ok)throw new Error(j.error||'ذخیره نشد');}catch(e){setError(e instanceof Error?e.message:'ذخیره نشد')}finally{setSaving('')}}
  return <>
    <div><h1 className="text-2xl font-bold">تنظیمات</h1><p className="mt-1 text-sm text-slate-500">قوانین اتوماسیون و رفتار هوشمند CRM</p></div>
    {error&&<div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="mt-6 grid gap-4">
      {rules.map(rule=><section key={rule.id} className="card p-5">
        <div className="flex flex-wrap items-start gap-4"><div className="rounded-xl bg-brand-50 p-3 text-brand-700"><Bot/></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="font-bold">{rule.name}</h2><span className={`badge ${rule.enabled?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}`}>{rule.enabled?'فعال':'خاموش'}</span></div><p className="mt-1 text-sm text-slate-500">{rule.description}</p></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rule.enabled} onChange={e=>patch(rule.id,{enabled:e.target.checked})}/>فعال</label></div>
        <div className="mt-5 grid gap-4 border-t pt-5 md:grid-cols-3">
          <div><label className="label"><TimerReset className="ml-1 inline" size={14}/>بعد از چند روز؟</label><input type="number" min="0" max="365" className="input" value={rule.thresholdDays} onChange={e=>patch(rule.id,{thresholdDays:Number(e.target.value)})}/></div>
          <div><label className="label"><BellRing className="ml-1 inline" size={14}/>Action</label><select className="input" value={rule.action} onChange={e=>patch(rule.id,{action:e.target.value})}><option value="ALERT">فقط اعلان</option><option value="ALERT_AND_TASK">اعلان + ساخت Task</option></select></div>
          <div><label className="label">اولویت</label><select className="input" value={rule.priority} onChange={e=>patch(rule.id,{priority:Number(e.target.value)})}><option value="1">کم</option><option value="2">متوسط</option><option value="3">زیاد</option><option value="4">فوری</option></select></div>
        </div>
        <div className="mt-4 flex justify-end"><button onClick={()=>save(rule)} disabled={saving===rule.id} className="btn-primary"><Save size={16}/>{saving===rule.id?'در حال ذخیره...':'ذخیره Rule'}</button></div>
      </section>)}
      {!rules.length&&!error&&<div className="card p-8 text-center text-sm text-slate-500">در حال دریافت قوانین...</div>}
    </div>
  </>;
}
