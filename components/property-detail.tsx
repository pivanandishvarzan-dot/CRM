'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BedDouble,
  Building,
  Calendar,
  CheckCircle2,
  Clock3,
  Edit3,
  MapPin,
  Maximize2,
  MessageSquare,
  Phone,
  Plus,
  User,
} from 'lucide-react';
import { agents, followups, owners } from '@/lib/demo-data';
import type { Property } from '@/lib/types';
import { Badge, Modal } from './ui';

type Props = { initialProperty: Property };

type PropertyActivity = {
  id: number;
  title: string;
  type: string;
  time: string;
  priority: string;
  agent: string;
};

const fallbackActivities: PropertyActivity[] = [
  { id: 901, title: 'ثبت اولیه فایل در سامانه', type: 'وظیفه', time: '۳ روز پیش', priority: 'انجام‌شده', agent: 'سیستم' },
  { id: 902, title: 'تماس اولیه با مالک', type: 'تماس', time: '۲ روز پیش', priority: 'انجام‌شده', agent: 'مشاور مسئول' },
];

function statusTone(status: string): 'green' | 'amber' | 'gray' {
  if (status === 'فعال') return 'green';
  if (status === 'در مذاکره' || status === 'ویژه') return 'amber';
  return 'gray';
}

export default function PropertyDetail({ initialProperty }: Props) {
  const [property, setProperty] = useState<Property>(initialProperty);
  const [editOpen, setEditOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activities, setActivities] = useState<PropertyActivity[]>(() => {
    const related = followups.filter(
      (item) => item.title.includes(initialProperty.district) || item.title.includes(initialProperty.owner) || item.agent === initialProperty.agent,
    );
    return related.length ? related : fallbackActivities;
  });

  const owner = useMemo(
    () => owners.find((item) => item.name === property.owner),
    [property.owner],
  );

  async function saveProperty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);

    const changes = {
      title: String(form.get('title') || property.title),
      type: String(form.get('type') || property.type),
      deal: String(form.get('deal') || property.deal),
      city: String(form.get('city') || property.city),
      district: String(form.get('district') || property.district),
      area: Number(form.get('area')) || 0,
      rooms: Number(form.get('rooms')) || 0,
      floor: Number(form.get('floor')) || 0,
      age: Number(form.get('age')) || 0,
      price: Number(form.get('price')) || 0,
      status: String(form.get('status') || property.status),
      features: String(form.get('features') || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'ذخیره تغییرات انجام نشد.');
      setProperty(payload.data);
      setEditOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ذخیره تغییرات انجام نشد.');
    } finally {
      setSaving(false);
    }
  }

  function addActivity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setActivities((current) => [{
      id: Date.now(),
      title: String(form.get('title') || 'پیگیری جدید'),
      type: String(form.get('type') || 'تماس'),
      time: String(form.get('time') || 'امروز'),
      priority: String(form.get('priority') || 'متوسط'),
      agent: String(form.get('agent') || property.agent),
    }, ...current]);
    setActivityOpen(false);
  }

  return (
    <>
      <Link href="/properties" className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-700">
        <ArrowRight size={17} />
        بازگشت به ملک‌ها
      </Link>

      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{property.title}</h1>
            <Badge tone={statusTone(property.status)}>{property.status}</Badge>
          </div>
          <p className="mt-2 flex items-center gap-1 text-sm text-slate-500"><MapPin size={16} />{property.district}، {property.city} · {property.code}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setActivityOpen(true)}><Plus size={17} />ثبت پیگیری</button>
          <button className="btn-primary" onClick={() => setEditOpen(true)}><Edit3 size={17} />ویرایش ملک</button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <img className="card h-[360px] w-full object-cover" src={property.image} alt={property.title} />

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div><h2 className="font-bold">مشخصات ملک</h2><p className="mt-1 text-xs text-slate-500">آخرین اطلاعات ثبت‌شده در پرونده ملک</p></div>
              <span className="text-xs text-slate-400">ثبت: {property.created}</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[[Maximize2,'متراژ',`${property.area} متر`],[BedDouble,'اتاق',`${property.rooms} خواب`],[Building,'طبقه',`${property.floor}`],[Calendar,'سن بنا',`${property.age} سال`]].map(([Icon,label,value]: any) => (
                <div key={label} className="rounded-xl bg-slate-50 p-4"><Icon className="mb-3 text-brand-600"/><small className="text-slate-500">{label}</small><b className="block">{value}</b></div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-3">
              <div><small className="text-slate-500">نوع ملک</small><b className="mt-1 block">{property.type}</b></div>
              <div><small className="text-slate-500">نوع معامله</small><b className="mt-1 block">{property.deal}</b></div>
              <div><small className="text-slate-500">وضعیت پرونده</small><b className="mt-1 block">{property.status}</b></div>
            </div>
            <h3 className="mb-3 mt-7 font-bold">امکانات</h3>
            <div className="flex flex-wrap gap-2">{property.features.length ? property.features.map((item) => <Badge key={item} tone="gray">✓ {item}</Badge>) : <span className="text-sm text-slate-400">امکاناتی ثبت نشده است.</span>}</div>
          </div>

          <div className="card p-6">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">تاریخچه پیگیری ملک</h2><p className="mt-1 text-xs text-slate-500">تماس‌ها، بازدیدها، پیام‌ها و وظایف مرتبط با این پرونده</p></div><button className="btn-secondary" onClick={() => setActivityOpen(true)}><Plus size={16}/>افزودن</button></div>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 rounded-xl border border-slate-100 p-4">
                  <span className="mt-0.5 rounded-xl bg-brand-50 p-2 text-brand-700">{activity.type === 'پیام' ? <MessageSquare size={18}/> : activity.priority === 'انجام‌شده' ? <CheckCircle2 size={18}/> : <Clock3 size={18}/>}</span>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className="text-sm">{activity.title}</b><Badge tone={activity.priority === 'فوری' ? 'red' : activity.priority === 'انجام‌شده' ? 'green' : 'gray'}>{activity.type}</Badge></div><p className="mt-1 text-xs text-slate-500">{activity.time} · {activity.agent} · اولویت {activity.priority}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="card p-6"><small className="text-slate-500">قیمت {property.deal}</small><b className="mt-2 block text-2xl text-brand-700">{property.price} میلیارد تومان</b><hr className="my-5"/><h3 className="font-bold">اطلاعات مالک</h3><div className="mt-4 flex gap-3"><span className="rounded-full bg-brand-50 p-3 text-brand-700"><User/></span><div><b>{property.owner}</b><p className="text-xs text-slate-500">{owner?.phone ?? 'شماره تماس ثبت نشده'}</p></div></div>{owner?.phone && <a href={`tel:${owner.phone.replace(/\s/g, '')}`} className="btn-primary mt-4 w-full"><Phone size={17}/>تماس با مالک</a>}</div>
          <div className="card p-6"><h3 className="font-bold">مشاور مسئول</h3><p className="mt-3 text-sm font-medium">{property.agent}</p><p className="mt-1 text-xs text-slate-500">{activities.length} پیگیری در پرونده فعلی</p></div>
        </aside>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="ویرایش اطلاعات ملک">
        <form onSubmit={saveProperty} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><label className="label">عنوان ملک</label><input name="title" defaultValue={property.title} required className="input"/></div>
          <div><label className="label">نوع ملک</label><select name="type" defaultValue={property.type} className="input">{['آپارتمان','ویلا','اداری','تجاری','پنت‌هاوس','کلنگی'].map((item) => <option key={item}>{item}</option>)}</select></div>
          <div><label className="label">نوع معامله</label><select name="deal" defaultValue={property.deal} className="input">{['فروش','اجاره','رهن و اجاره'].map((item) => <option key={item}>{item}</option>)}</select></div>
          <div><label className="label">شهر</label><input name="city" defaultValue={property.city} className="input"/></div>
          <div><label className="label">منطقه</label><input name="district" defaultValue={property.district} className="input"/></div>
          <div><label className="label">متراژ</label><input name="area" defaultValue={property.area} type="number" className="input"/></div>
          <div><label className="label">قیمت (میلیارد تومان)</label><input name="price" defaultValue={property.price} type="number" step="0.1" className="input"/></div>
          <div><label className="label">تعداد خواب</label><input name="rooms" defaultValue={property.rooms} type="number" className="input"/></div>
          <div><label className="label">طبقه</label><input name="floor" defaultValue={property.floor} type="number" className="input"/></div>
          <div><label className="label">سن بنا</label><input name="age" defaultValue={property.age} type="number" className="input"/></div>
          <div><label className="label">وضعیت</label><select name="status" defaultValue={property.status} className="input">{['فعال','در مذاکره','فروخته شد','اجاره داده شد','آرشیو'].map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="md:col-span-2"><label className="label">امکانات</label><input name="features" defaultValue={property.features.join(', ')} className="input" placeholder="پارکینگ، آسانسور، انباری"/></div>
          {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}
          <div className="md:col-span-2 flex justify-end gap-2 pt-3"><button type="button" onClick={() => setEditOpen(false)} className="btn-secondary">انصراف</button><button disabled={saving} className="btn-primary">{saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</button></div>
        </form>
      </Modal>

      <Modal open={activityOpen} onClose={() => setActivityOpen(false)} title="ثبت پیگیری جدید">
        <form onSubmit={addActivity} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><label className="label">عنوان پیگیری</label><input required name="title" className="input" placeholder="مثلاً تماس با مالک برای هماهنگی بازدید"/></div>
          <div><label className="label">نوع</label><select name="type" className="input">{['تماس','پیام','جلسه','بازدید','وظیفه'].map((item) => <option key={item}>{item}</option>)}</select></div>
          <div><label className="label">اولویت</label><select name="priority" className="input">{['فوری','زیاد','متوسط','کم'].map((item) => <option key={item}>{item}</option>)}</select></div>
          <div><label className="label">زمان</label><input name="time" className="input" placeholder="امروز، ۱۷:۳۰"/></div>
          <div><label className="label">مشاور</label><select name="agent" defaultValue={property.agent} className="input">{agents.map((item) => <option key={item.name}>{item.name}</option>)}</select></div>
          <div className="md:col-span-2 flex justify-end gap-2 pt-3"><button type="button" onClick={() => setActivityOpen(false)} className="btn-secondary">انصراف</button><button className="btn-primary">ثبت پیگیری</button></div>
        </form>
      </Modal>
    </>
  );
}
