'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BedDouble, Grid2X2, List, MapPin, Maximize2, Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { properties as initialProperties } from '@/lib/demo-data';
import type { Property } from '@/lib/types';
import { Badge, Empty, Modal } from './ui';

const propertyTypes = ['آپارتمان', 'ویلا', 'اداری', 'تجاری', 'پنت‌هاوس', 'کلنگی'];
const dealTypes = ['فروش', 'اجاره', 'رهن و اجاره'];
const statuses = ['فعال', 'ویژه', 'در مذاکره', 'فروخته شد'];
const defaultImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80';

type OwnerOption = { id: string; name: string; phone?: string };
type AgentOption = { id: string; name: string; email?: string | null };

function statusTone(status: string): 'green' | 'amber' | 'gray' {
  if (status === 'فعال') return 'green';
  if (status === 'در مذاکره' || status === 'ویژه') return 'amber';
  return 'gray';
}

export default function PropertiesView() {
  const [data, setData] = useState<Property[]>(initialProperties);
  const [query, setQuery] = useState('');
  const [deal, setDeal] = useState('همه');
  const [status, setStatus] = useState('همه');
  const [district, setDistrict] = useState('همه');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    Promise.all([fetch('/api/owners').then((r) => r.json()), fetch('/api/agents').then((r) => r.json())])
      .then(([ownerData, agentData]) => {
        if (Array.isArray(ownerData)) setOwners(ownerData);
        if (Array.isArray(agentData)) setAgents(agentData);
      })
      .catch(() => undefined);
  }, []);

  const districts = useMemo(() => ['همه', ...Array.from(new Set(data.map((item) => item.district)))], [data]);
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim();
    return data.filter((property) => {
      const searchable = `${property.title} ${property.district} ${property.city} ${property.code} ${property.owner} ${property.agent}`;
      return searchable.includes(normalizedQuery) &&
        (deal === 'همه' || property.deal === deal) &&
        (status === 'همه' || property.status === status) &&
        (district === 'همه' || property.district === district);
    });
  }, [data, deal, district, query, status]);

  const activeFilterCount = [deal, status, district].filter((value) => value !== 'همه').length;

  function resetFilters() {
    setQuery(''); setDeal('همه'); setStatus('همه'); setDistrict('همه');
  }

  async function addProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setFormError('');
    const form = new FormData(event.currentTarget);
    const ownerId = String(form.get('ownerId') || '');
    const agentId = String(form.get('agentId') || '');
    const payload = {
      title: String(form.get('title') || '').trim(),
      type: String(form.get('type') || 'آپارتمان'),
      deal: String(form.get('deal') || 'فروش'),
      city: String(form.get('city') || 'تهران').trim(),
      district: String(form.get('district') || '').trim(),
      price: Number(form.get('price')) || 0,
      area: Number(form.get('area')) || 0,
      rooms: Number(form.get('rooms')) || 0,
      floor: Number(form.get('floor')) || 0,
      age: Number(form.get('age')) || 0,
      status: String(form.get('status') || 'فعال'),
      image: String(form.get('image') || '').trim() || defaultImage,
      features: String(form.get('features') || '').split('،').map((x) => x.trim()).filter(Boolean),
      ownerId,
      agentId,
    };

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ثبت ملک انجام نشد.');

      const ownerName = owners.find((o) => o.id === ownerId)?.name || 'مالک ثبت‌نشده';
      const agentName = agents.find((a) => a.id === agentId)?.name || 'بدون مشاور';
      const property: Property = {
        id: result.id ?? String(Date.now()),
        title: result.title ?? payload.title,
        code: result.code ?? `MLK-${Date.now()}`,
        type: result.type ?? payload.type,
        deal: result.deal ?? payload.deal,
        area: result.area ?? payload.area,
        rooms: result.rooms ?? payload.rooms,
        district: result.district ?? payload.district,
        city: result.city ?? payload.city,
        price: Number(result.price ?? payload.price),
        status: result.status ?? payload.status,
        owner: typeof result.owner === 'object' ? result.owner.name : ownerName,
        agent: typeof result.agent === 'object' ? result.agent.name : agentName,
        image: result.image ?? payload.image,
        created: result.created ?? new Intl.DateTimeFormat('fa-IR-u-ca-persian').format(new Date()),
        floor: result.floor ?? payload.floor,
        age: result.age ?? payload.age,
        features: result.features ?? payload.features,
      };
      setData((current) => [property, ...current]);
      setModalOpen(false);
      event.currentTarget.reset();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'خطا در ثبت ملک');
    } finally {
      setSaving(false);
    }
  }

  async function removeProperty(id: string | number) {
    if (!window.confirm('از حذف این ملک مطمئن هستید؟')) return;
    const response = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
    if (response.ok) setData((current) => current.filter((property) => String(property.id) !== String(id)));
  }

  return <>
    <Header title="مدیریت ملک‌ها" sub={`${data.length} ملک ثبت‌شده · ${filtered.length} نتیجه قابل نمایش`} action={() => setModalOpen(true)} label="ثبت ملک جدید" />
    <div className="card mb-5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1"><Search className="absolute right-3 top-3 text-slate-400" size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} className="input pr-10" placeholder="عنوان، کد، منطقه، مالک یا مشاور..."/></div>
        <select value={deal} onChange={(e)=>setDeal(e.target.value)} className="input w-40"><option>همه</option>{dealTypes.map((x)=><option key={x}>{x}</option>)}</select>
        <button type="button" onClick={()=>setAdvancedOpen((v)=>!v)} className="btn-secondary"><SlidersHorizontal size={17}/>فیلتر پیشرفته{activeFilterCount>0&&<span className="badge bg-brand-50 text-brand-700">{activeFilterCount}</span>}</button>
        <div className="flex rounded-xl border p-1"><button type="button" aria-label="نمای کارت" onClick={()=>setView('grid')} className={`rounded-lg p-2 ${view==='grid'?'bg-brand-50 text-brand-700':''}`}><Grid2X2 size={18}/></button><button type="button" aria-label="نمای فهرست" onClick={()=>setView('list')} className={`rounded-lg p-2 ${view==='list'?'bg-brand-50 text-brand-700':''}`}><List size={18}/></button></div>
      </div>
      {advancedOpen&&<div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4"><div><label className="label">وضعیت</label><select value={status} onChange={(e)=>setStatus(e.target.value)} className="input"><option>همه</option>{statuses.map((x)=><option key={x}>{x}</option>)}</select></div><div><label className="label">منطقه</label><select value={district} onChange={(e)=>setDistrict(e.target.value)} className="input">{districts.map((x)=><option key={x}>{x}</option>)}</select></div><div className="flex items-end sm:col-span-2"><button type="button" onClick={resetFilters} className="btn-secondary"><X size={17}/>پاک کردن فیلترها</button></div></div>}
    </div>
    {!filtered.length?<div className="card p-4"><Empty/><div className="pb-4 text-center"><button type="button" onClick={resetFilters} className="text-sm text-brand-700">نمایش همه ملک‌ها</button></div></div>:view==='grid'?<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((property)=><article className="card group overflow-hidden" key={String(property.id)}><div className="relative h-48"><img src={property.image} alt={property.title} className="h-full w-full object-cover"/><span className="absolute right-3 top-3"><Badge tone={statusTone(property.status)}>{property.status}</Badge></span><button type="button" onClick={()=>removeProperty(property.id)} aria-label={`حذف ${property.title}`} className="absolute left-3 top-3 rounded-lg bg-white/90 p-2 text-red-500 opacity-0 transition group-hover:opacity-100 focus:opacity-100"><Trash2 size={17}/></button></div><div className="p-5"><div className="flex justify-between gap-2"><Link href={`/properties/${property.id}`} className="font-bold hover:text-brand-700">{property.title}</Link><small className="text-slate-400">{property.code}</small></div><p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><MapPin size={14}/>{property.district}، {property.city}</p><div className="my-4 flex flex-wrap gap-4 border-y py-3 text-xs text-slate-600"><span className="flex gap-1"><Maximize2 size={15}/>{property.area} متر</span><span className="flex gap-1"><BedDouble size={16}/>{property.rooms} خواب</span><span>طبقه {property.floor}</span></div><div className="flex items-end justify-between gap-4"><div><small className="text-slate-500">{property.deal}</small><b className="block text-brand-700">{property.price} میلیارد تومان</b></div><div className="text-left text-xs text-slate-500"><span className="block">{property.agent}</span><span className="mt-1 block text-[11px]">{property.owner}</span></div></div></div></article>)}</div>:<div className="card table-wrap"><table className="data-table"><thead><tr><th>ملک</th><th>معامله</th><th>منطقه</th><th>متراژ</th><th>قیمت</th><th>مسئول</th><th>وضعیت</th><th/></tr></thead><tbody>{filtered.map((property)=><tr key={String(property.id)}><td><Link className="font-bold hover:text-brand-700" href={`/properties/${property.id}`}>{property.title}<small className="block font-normal text-slate-400">{property.code}</small></Link></td><td>{property.deal}</td><td>{property.district}</td><td>{property.area} متر</td><td>{property.price} میلیارد</td><td>{property.agent}</td><td><Badge tone={statusTone(property.status)}>{property.status}</Badge></td><td><button type="button" onClick={()=>removeProperty(property.id)} className="text-red-500" aria-label={`حذف ${property.title}`}><Trash2 size={17}/></button></td></tr>)}</tbody></table></div>}
    <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title="ثبت ملک جدید"><form onSubmit={addProperty} className="grid gap-4 md:grid-cols-2"><div className="md:col-span-2"><label className="label">عنوان ملک</label><input required name="title" className="input" placeholder="مثلاً آپارتمان سه‌خوابه پاسداران"/></div><FieldSelect label="نوع ملک" name="type" options={propertyTypes}/><FieldSelect label="نوع معامله" name="deal" options={dealTypes}/><div><label className="label">شهر</label><input required name="city" defaultValue="تهران" className="input"/></div><div><label className="label">منطقه / محله</label><input required name="district" className="input" placeholder="مثلاً پاسداران"/></div><div><label className="label">قیمت (میلیارد تومان)</label><input required name="price" type="number" min="0" step="0.1" className="input"/></div><div><label className="label">متراژ</label><input required name="area" type="number" min="0" className="input"/></div><div><label className="label">تعداد اتاق</label><input name="rooms" type="number" min="0" className="input" defaultValue="2"/></div><div><label className="label">طبقه</label><input name="floor" type="number" min="0" className="input" defaultValue="1"/></div><div><label className="label">سن بنا</label><input name="age" type="number" min="0" className="input" defaultValue="0"/></div><FieldSelect label="وضعیت" name="status" options={statuses}/><div><label className="label">مالک</label><select required name="ownerId" className="input"><option value="">انتخاب مالک</option>{owners.map((o)=><option key={o.id} value={o.id}>{o.name} · {o.phone}</option>)}</select>{!owners.length&&<p className="mt-1 text-xs text-amber-600">ابتدا یک مالک در بخش مالک‌ها ثبت کنید.</p>}</div><div><label className="label">مشاور مسئول</label><select required name="agentId" className="input"><option value="">انتخاب مشاور</option>{agents.map((a)=><option key={a.id} value={a.id}>{a.name}</option>)}</select>{!agents.length&&<p className="mt-1 text-xs text-amber-600">مشاوری برای انتخاب وجود ندارد.</p>}</div><div className="md:col-span-2"><label className="label">امکانات</label><input name="features" className="input" placeholder="پارکینگ، آسانسور، انباری"/></div><div className="md:col-span-2"><label className="label">آدرس تصویر</label><input name="image" className="input" dir="ltr" placeholder="https://..."/></div>{formError&&<div className="md:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">{formError}</div>}<div className="md:col-span-2 flex justify-end gap-2 pt-3"><button type="button" onClick={()=>setModalOpen(false)} className="btn-secondary">انصراف</button><button disabled={saving||!owners.length||!agents.length} className="btn-primary disabled:opacity-50">{saving?'در حال ذخیره...':'ذخیره ملک'}</button></div></form></Modal>
  </>;
}

function FieldSelect({label,name,options}:{label:string;name:string;options:string[]}){return <div><label className="label">{label}</label><select name={name} className="input">{options.map((x)=><option key={x}>{x}</option>)}</select></div>}
export function Header({title,sub,action,label}:{title:string;sub:string;action?:()=>void;label?:string}){return <div className="mb-6 flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">{title}</h1><p className="mt-1 text-sm text-slate-500">{sub}</p></div>{action&&<button onClick={action} className="btn-primary shrink-0"><Plus size={18}/>{label}</button>}</div>}
