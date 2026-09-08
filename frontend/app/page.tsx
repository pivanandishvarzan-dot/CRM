'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Users, UserRoundSearch, CalendarCheck2, FileText, BarChart3, Settings, LayoutDashboard, Plus, Search, Home, RefreshCw, X } from 'lucide-react';

type Row = Record<string, any>;
type View = 'dashboard'|'properties'|'owners'|'applicants'|'followups'|'contracts'|'reports'|'settings';

const nav:[View,string,any][]=[
  ['dashboard','داشبورد',LayoutDashboard],['properties','املاک',Building2],['owners','مالک‌ها',Users],['applicants','متقاضی‌ها',UserRoundSearch],['followups','پیگیری‌ها',CalendarCheck2],['contracts','قراردادها',FileText],['reports','گزارش‌ها',BarChart3],['settings','تنظیمات',Settings]
];

const faStatus:Record<string,string>={DRAFT:'پیش‌نویس',ACTIVE:'فعال',NEGOTIATING:'در مذاکره',SOLD:'فروخته‌شده',RENTED:'اجاره‌شده',ARCHIVED:'آرشیو',SALE:'فروش',RENT:'اجاره',MORTGAGE_RENT:'رهن و اجاره'};
const money=(v:any)=>v===null||v===undefined?'—':Number(v).toLocaleString('fa-IR')+' تومان';
const txt=(v:any)=>v===null||v===undefined||v===''?'—':String(v);

async function api(path:string, init?:RequestInit){
  const r=await fetch(`/api/${path}`,{...init,headers:{'Content-Type':'application/json',...(init?.headers||{})},credentials:'include'});
  const j=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(j.error||'خطا در ارتباط با سرور');
  return j.data;
}

export default function Page(){
  const [view,setView]=useState<View>('dashboard');
  const [data,setData]=useState<Record<string,any>>({});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [query,setQuery]=useState('');
  const [showProperty,setShowProperty]=useState(false);

  const load=async()=>{
    setLoading(true);setError('');
    try{
      const keys=view==='dashboard'?['properties','owners','applicants','followups','contracts']:view==='reports'?['reports']:view==='settings'?['settings']:[view];
      const values=await Promise.all(keys.map(k=>api(k)));
      setData(d=>({...d,...Object.fromEntries(keys.map((k,i)=>[k,values[i]]))}));
    }catch(e:any){setError(e.message||'خطای ناشناخته');}
    finally{setLoading(false)}
  };
  useEffect(()=>{load()},[view]);

  const title=nav.find(n=>n[0]===view)?.[1]||'';
  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="brandmark"><Home size={22}/></div><div><b>ملکینو CRM</b><small>مدیریت هوشمند املاک</small></div></div>
      <div className="nav">{nav.map(([id,label,Icon])=><button key={id} className={view===id?'active':''} onClick={()=>{setView(id);setQuery('')}}><Icon size={19}/><span>{label}</span></button>)}</div>
    </aside>
    <main className="main">
      <header className="topbar"><input className="search" placeholder="جست‌وجوی سریع در CRM..." value={query} onChange={e=>setQuery(e.target.value)}/><div style={{display:'flex',gap:9}}><button className="secondary" onClick={load}><RefreshCw size={16}/></button>{view==='properties'&&<button className="primary" onClick={()=>setShowProperty(true)}><Plus size={16} style={{verticalAlign:'middle'}}/> ثبت ملک</button>}</div></header>
      <section className="content">
        <div className="hero"><div><h1>{title}</h1><div className="muted">نمای یکپارچه و عملیاتی برای مدیریت دفتر املاک</div></div></div>
        {error&&<div className="error">{error}</div>}
        {view==='dashboard'?<Dashboard data={data} loading={loading}/>:<Module view={view} rows={data[view]} query={query} loading={loading}/>} 
      </section>
    </main>
    {showProperty&&<PropertyModal onClose={()=>setShowProperty(false)} onSaved={()=>{setShowProperty(false);load()}}/>}
  </div>
}

function Dashboard({data,loading}:{data:Record<string,any>,loading:boolean}){
  const props=Array.isArray(data.properties)?data.properties:[];
  const owners=Array.isArray(data.owners)?data.owners:[];
  const applicants=Array.isArray(data.applicants)?data.applicants:[];
  const followups=Array.isArray(data.followups)?data.followups:[];
  const contracts=Array.isArray(data.contracts)?data.contracts:[];
  const active=props.filter((p:Row)=>p.status==='ACTIVE').length;
  const pending=followups.filter((f:Row)=>!f.completed).length;
  const commission=contracts.reduce((s:number,c:Row)=>s+Number(c.commission||0),0);
  const stats=[[Building2,'ملک فعال',active],[Users,'مالک ثبت‌شده',owners.length],[UserRoundSearch,'متقاضی',applicants.length],[FileText,'کمیسیون کل',commission?commission.toLocaleString('fa-IR'):'۰']];
  return <>
    <div className="grid4">{stats.map(([Icon,label,value]:any,i)=><div className="stat" key={i}><div className="statTop"><span className="muted">{label}</span><span className="iconbox"><Icon size={20}/></span></div>{loading?<div className="skeleton" style={{marginTop:18,width:'60%'}}/>:<strong>{value}</strong>}</div>)}</div>
    <div className="cols">
      <div className="card"><h3>آخرین فایل‌های ملکی</h3><Table rows={props.slice(0,6)} columns={[['code','کد'],['title','عنوان'],['district','محله'],['price','قیمت'],['status','وضعیت']]} loading={loading}/></div>
      <div className="card"><h3>پیگیری‌های باز <span className="badge">{pending.toLocaleString('fa-IR')}</span></h3><div className="list">{followups.filter((f:Row)=>!f.completed).slice(0,6).map((f:Row)=><div className="item" key={f.id}><div><div className="itemTitle">{f.title}</div><small className="muted">{f.type||'پیگیری'}</small></div><span className="badge">{f.priority?`اولویت ${f.priority}`:'باز'}</span></div>)}{!loading&&!followups.length&&<div className="empty">پیگیری بازی وجود ندارد.</div>}</div></div>
    </div>
  </>
}

const configs:Record<string,{cols:[string,string][],empty:string}>={
  properties:{cols:[['code','کد فایل'],['title','عنوان'],['type','نوع'],['district','محله'],['area','متراژ'],['rooms','خواب'],['price','قیمت'],['status','وضعیت']],empty:'هنوز ملکی ثبت نشده است.'},
  owners:{cols:[['name','نام مالک'],['phone','تلفن'],['email','ایمیل'],['address','آدرس']],empty:'هنوز مالکی ثبت نشده است.'},
  applicants:{cols:[['name','نام متقاضی'],['phone','تلفن'],['requestType','نوع درخواست'],['budgetMin','بودجه از'],['budgetMax','بودجه تا'],['urgency','فوریت'],['status','وضعیت']],empty:'هنوز متقاضی‌ای ثبت نشده است.'},
  followups:{cols:[['title','عنوان'],['type','نوع'],['scheduledAt','زمان'],['priority','اولویت'],['completed','انجام شده']],empty:'پیگیری‌ای وجود ندارد.'},
  contracts:{cols:[['number','شماره'],['type','نوع'],['amount','مبلغ'],['commission','کمیسیون'],['contractDate','تاریخ'],['status','وضعیت']],empty:'قراردادی ثبت نشده است.'}
};

function Module({view,rows,query,loading}:{view:View,rows:any,query:string,loading:boolean}){
  if(view==='reports') return <Reports data={rows} loading={loading}/>;
  if(view==='settings') return <SettingsView data={rows} loading={loading}/>;
  const cfg=configs[view];
  const list=Array.isArray(rows)?rows:[];
  const filtered=useMemo(()=>list.filter((r:Row)=>!query||JSON.stringify(r).toLowerCase().includes(query.toLowerCase())),[list,query]);
  return <div className="card"><div className="toolbar"><div style={{position:'relative'}}><Search size={16} style={{position:'absolute',right:12,top:13,color:'#8793a3'}}/><input style={{paddingRight:36}} value={query} readOnly placeholder="جست‌وجو..."/></div><span className="badge">{filtered.length.toLocaleString('fa-IR')} رکورد</span></div><Table rows={filtered} columns={cfg.cols} loading={loading}/>{!loading&&!filtered.length&&<div className="empty">{cfg.empty}</div>}</div>
}

function Table({rows,columns,loading}:{rows:Row[],columns:[string,string][],loading:boolean}){
  if(loading)return <div style={{display:'grid',gap:13}}>{[1,2,3,4].map(i=><div className="skeleton" key={i}/>)}</div>;
  return <div className="tablewrap"><table className="table"><thead><tr>{columns.map(c=><th key={c[0]}>{c[1]}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||i}>{columns.map(([key])=><td key={key}>{formatCell(key,r[key])}</td>)}</tr>)}</tbody></table></div>
}

function formatCell(key:string,v:any){
  if(['price','deposit','rent','budgetMin','budgetMax','amount','commission'].includes(key)) return money(v);
  if(key==='status'||key==='requestType') return <span className="badge">{faStatus[String(v)]||txt(v)}</span>;
  if(key==='completed') return v?'بله':'خیر';
  if(key.toLowerCase().includes('date')||key==='scheduledAt') return v?new Date(v).toLocaleDateString('fa-IR'):'—';
  return txt(v);
}

function Reports({data,loading}:{data:any,loading:boolean}){
  if(loading)return <div className="card"><div className="skeleton"/><br/><div className="skeleton"/></div>;
  const entries=data&&typeof data==='object'?Object.entries(data):[];
  return <div className="grid4">{entries.length?entries.slice(0,12).map(([k,v])=><div className="stat" key={k}><span className="muted">{labelize(k)}</span><strong style={{fontSize:22}}>{typeof v==='number'?v.toLocaleString('fa-IR'):Array.isArray(v)?v.length.toLocaleString('fa-IR'):txt(v)}</strong></div>):<div className="card empty" style={{gridColumn:'1/-1'}}>داده گزارش هنوز از API دریافت نشده است.</div>}</div>
}
function labelize(k:string){const d:Record<string,string>={properties:'املاک',owners:'مالک‌ها',applicants:'متقاضی‌ها',contracts:'قراردادها',followups:'پیگیری‌ها',revenue:'درآمد',commission:'کمیسیون',total:'مجموع'};return d[k]||k.replace(/([A-Z])/g,' $1')}

function SettingsView({data,loading}:{data:any,loading:boolean}){
  return <div className="cols"><div className="card"><h3>تنظیمات دفتر</h3>{loading?<div className="skeleton"/>:<div className="list">{data&&typeof data==='object'?Object.entries(data).map(([k,v])=><div className="item" key={k}><span>{labelize(k)}</span><b>{txt(v)}</b></div>):<div className="empty">تنظیمات قابل نمایش وجود ندارد.</div>}</div>}</div><div className="card"><h3>وضعیت اتصال</h3><div className="item"><span>Backend API</span><span className="badge">متصل از طریق Proxy</span></div><p className="muted" style={{lineHeight:2}}>فرانت‌اند مستقل است و درخواست‌های مسیر <b>/api</b> را به Backend اصلی منتقل می‌کند؛ بنابراین مدل داده و منطق فعلی سرور دست‌نخورده می‌ماند.</p></div></div>
}

function PropertyModal({onClose,onSaved}:{onClose:()=>void,onSaved:()=>void}){
  const [form,setForm]=useState({title:'',type:'آپارتمان',deal:'SALE',city:'تهران',district:'',price:'',area:'',rooms:'',floor:'',age:'',ownerName:''});
  const [saving,setSaving]=useState(false);const [error,setError]=useState('');
  const set=(k:string,v:string)=>setForm(f=>({...f,[k]:v}));
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setSaving(true);setError('');try{await api('properties',{method:'POST',body:JSON.stringify(form)});onSaved()}catch(e:any){setError(e.message)}finally{setSaving(false)}};
  return <div className="modal" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><form className="modalbox" onSubmit={submit}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}><div><h2 style={{margin:0}}>ثبت فایل ملکی جدید</h2><small className="muted">اطلاعات اصلی فایل را وارد کنید</small></div><button type="button" className="secondary" onClick={onClose}><X size={17}/></button></div>{error&&<div className="error">{error}</div>}<div className="form">
    <label className="span2">عنوان ملک<input required value={form.title} onChange={e=>set('title',e.target.value)} placeholder="مثلاً آپارتمان ۱۲۰ متری نیاوران"/></label>
    <label>نوع ملک<select value={form.type} onChange={e=>set('type',e.target.value)}><option>آپارتمان</option><option>ویلایی</option><option>اداری</option><option>تجاری</option><option>زمین</option></select></label>
    <label>نوع معامله<select value={form.deal} onChange={e=>set('deal',e.target.value)}><option value="SALE">فروش</option><option value="RENT">اجاره</option><option value="MORTGAGE_RENT">رهن و اجاره</option></select></label>
    <label>شهر<input required value={form.city} onChange={e=>set('city',e.target.value)}/></label><label>محله<input required value={form.district} onChange={e=>set('district',e.target.value)} placeholder="محله"/></label>
    <label>قیمت<input inputMode="numeric" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="تومان"/></label><label>متراژ<input inputMode="numeric" value={form.area} onChange={e=>set('area',e.target.value)}/></label>
    <label>تعداد خواب<input inputMode="numeric" value={form.rooms} onChange={e=>set('rooms',e.target.value)}/></label><label>طبقه<input inputMode="numeric" value={form.floor} onChange={e=>set('floor',e.target.value)}/></label>
    <label>سن بنا<input inputMode="numeric" value={form.age} onChange={e=>set('age',e.target.value)}/></label><label>نام مالک<input value={form.ownerName} onChange={e=>set('ownerName',e.target.value)}/></label>
  </div><div className="actions"><button type="button" className="secondary" onClick={onClose}>انصراف</button><button className="primary" disabled={saving}>{saving?'در حال ثبت...':'ثبت ملک'}</button></div></form></div>
}
