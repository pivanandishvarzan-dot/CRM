'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import {
  BedDouble,
  Grid2X2,
  List,
  MapPin,
  Maximize2,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { properties as initialProperties } from '@/lib/demo-data';
import type { Property } from '@/lib/types';
import { Badge, Empty, Modal } from './ui';

const propertyTypes = ['آپارتمان', 'ویلا', 'اداری', 'تجاری', 'پنت‌هاوس', 'کلنگی'];
const dealTypes = ['فروش', 'اجاره', 'رهن و اجاره'];
const statuses = ['فعال', 'ویژه', 'در مذاکره', 'فروخته شد'];
const agents = ['سارا احمدی', 'امیر رضایی', 'نگار محمدی', 'علی نادری'];
const defaultImage =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80';

function getTodayFa() {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/\u200e|\u200f/g, '');
}

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

  const districts = useMemo(
    () => ['همه', ...Array.from(new Set(data.map((item) => item.district)))],
    [data],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim();
    return data.filter((property) => {
      const searchable = `${property.title} ${property.district} ${property.city} ${property.code} ${property.owner} ${property.agent}`;
      return (
        searchable.includes(normalizedQuery) &&
        (deal === 'همه' || property.deal === deal) &&
        (status === 'همه' || property.status === status) &&
        (district === 'همه' || property.district === district)
      );
    });
  }, [data, deal, district, query, status]);

  const activeFilterCount = [deal, status, district].filter((value) => value !== 'همه').length;

  function resetFilters() {
    setQuery('');
    setDeal('همه');
    setStatus('همه');
    setDistrict('همه');
  }

  function addProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = Date.now();
    const features = String(form.get('features') ?? '')
      .split('،')
      .map((item) => item.trim())
      .filter(Boolean);

    const property: Property = {
      id,
      title: String(form.get('title') ?? '').trim(),
      code: `MLK-${String(id).slice(-5)}`,
      type: String(form.get('type') ?? 'آپارتمان'),
      deal: String(form.get('deal') ?? 'فروش'),
      area: Number(form.get('area')) || 0,
      rooms: Number(form.get('rooms')) || 0,
      district: String(form.get('district') ?? '').trim(),
      city: String(form.get('city') ?? 'تهران').trim(),
      price: Number(form.get('price')) || 0,
      status: String(form.get('status') ?? 'فعال'),
      owner: String(form.get('owner') ?? '').trim() || 'مالک ثبت‌نشده',
      agent: String(form.get('agent') ?? agents[0]),
      image: String(form.get('image') ?? '').trim() || defaultImage,
      created: getTodayFa(),
      floor: Number(form.get('floor')) || 0,
      age: Number(form.get('age')) || 0,
      features,
    };

    setData((current) => [property, ...current]);
    setModalOpen(false);
    event.currentTarget.reset();
  }

  function removeProperty(id: number) {
    if (!window.confirm('از حذف این ملک مطمئن هستید؟')) return;
    setData((current) => current.filter((property) => property.id !== id));
  }

  return (
    <>
      <Header
        title="مدیریت ملک‌ها"
        sub={`${data.length} ملک ثبت‌شده · ${filtered.length} نتیجه قابل نمایش`}
        action={() => setModalOpen(true)}
        label="ثبت ملک جدید"
      />

      <div className="card mb-5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute right-3 top-3 text-slate-400" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input pr-10"
              placeholder="عنوان، کد، منطقه، مالک یا مشاور..."
            />
          </div>

          <select value={deal} onChange={(event) => setDeal(event.target.value)} className="input w-40">
            <option>همه</option>
            {dealTypes.map((item) => <option key={item}>{item}</option>)}
          </select>

          <button
            type="button"
            onClick={() => setAdvancedOpen((open) => !open)}
            className="btn-secondary"
          >
            <SlidersHorizontal size={17} />
            فیلتر پیشرفته
            {activeFilterCount > 0 && <span className="badge bg-brand-50 text-brand-700">{activeFilterCount}</span>}
          </button>

          <div className="flex rounded-xl border p-1">
            <button
              type="button"
              aria-label="نمای کارت"
              onClick={() => setView('grid')}
              className={`rounded-lg p-2 ${view === 'grid' ? 'bg-brand-50 text-brand-700' : ''}`}
            >
              <Grid2X2 size={18} />
            </button>
            <button
              type="button"
              aria-label="نمای فهرست"
              onClick={() => setView('list')}
              className={`rounded-lg p-2 ${view === 'list' ? 'bg-brand-50 text-brand-700' : ''}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {advancedOpen && (
          <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">وضعیت</label>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="input">
                <option>همه</option>
                {statuses.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="label">منطقه</label>
              <select value={district} onChange={(event) => setDistrict(event.target.value)} className="input">
                {districts.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="flex items-end sm:col-span-2">
              <button type="button" onClick={resetFilters} className="btn-secondary">
                <X size={17} /> پاک کردن فیلترها
              </button>
            </div>
          </div>
        )}
      </div>

      {!filtered.length ? (
        <div className="card p-4">
          <Empty />
          <div className="pb-4 text-center">
            <button type="button" onClick={resetFilters} className="text-sm text-brand-700">
              نمایش همه ملک‌ها
            </button>
          </div>
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((property) => (
            <article className="card group overflow-hidden" key={property.id}>
              <div className="relative h-48">
                <img src={property.image} alt={property.title} className="h-full w-full object-cover" />
                <span className="absolute right-3 top-3">
                  <Badge tone={statusTone(property.status)}>{property.status}</Badge>
                </span>
                <button
                  type="button"
                  onClick={() => removeProperty(property.id)}
                  aria-label={`حذف ${property.title}`}
                  className="absolute left-3 top-3 rounded-lg bg-white/90 p-2 text-red-500 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 size={17} />
                </button>
              </div>

              <div className="p-5">
                <div className="flex justify-between gap-2">
                  <Link href={`/properties/${property.id}`} className="font-bold hover:text-brand-700">
                    {property.title}
                  </Link>
                  <small className="text-slate-400">{property.code}</small>
                </div>
                <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={14} /> {property.district}، {property.city}
                </p>
                <div className="my-4 flex flex-wrap gap-4 border-y py-3 text-xs text-slate-600">
                  <span className="flex gap-1"><Maximize2 size={15} />{property.area} متر</span>
                  <span className="flex gap-1"><BedDouble size={16} />{property.rooms} خواب</span>
                  <span>طبقه {property.floor}</span>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <small className="text-slate-500">{property.deal}</small>
                    <b className="block text-brand-700">{property.price} میلیارد تومان</b>
                  </div>
                  <div className="text-left text-xs text-slate-500">
                    <span className="block">{property.agent}</span>
                    <span className="mt-1 block text-[11px]">{property.owner}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ملک</th><th>معامله</th><th>منطقه</th><th>متراژ</th><th>قیمت</th><th>مسئول</th><th>وضعیت</th><th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((property) => (
                <tr key={property.id}>
                  <td>
                    <Link className="font-bold hover:text-brand-700" href={`/properties/${property.id}`}>
                      {property.title}
                      <small className="block font-normal text-slate-400">{property.code}</small>
                    </Link>
                  </td>
                  <td>{property.deal}</td>
                  <td>{property.district}</td>
                  <td>{property.area} متر</td>
                  <td>{property.price} میلیارد</td>
                  <td>{property.agent}</td>
                  <td><Badge tone={statusTone(property.status)}>{property.status}</Badge></td>
                  <td>
                    <button type="button" onClick={() => removeProperty(property.id)} className="text-red-500" aria-label={`حذف ${property.title}`}>
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="ثبت ملک جدید">
        <form onSubmit={addProperty} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">عنوان ملک</label>
            <input required name="title" className="input" placeholder="مثلاً آپارتمان سه‌خوابه پاسداران" />
          </div>

          <FieldSelect label="نوع ملک" name="type" options={propertyTypes} />
          <FieldSelect label="نوع معامله" name="deal" options={dealTypes} />

          <div>
            <label className="label">شهر</label>
            <input required name="city" defaultValue="تهران" className="input" />
          </div>
          <div>
            <label className="label">منطقه / محله</label>
            <input required name="district" className="input" placeholder="مثلاً پاسداران" />
          </div>

          <div>
            <label className="label">قیمت (میلیارد تومان)</label>
            <input required name="price" type="number" min="0" step="0.1" className="input" />
          </div>
          <div>
            <label className="label">متراژ</label>
            <input required name="area" type="number" min="0" className="input" />
          </div>
          <div>
            <label className="label">تعداد اتاق</label>
            <input name="rooms" type="number" min="0" className="input" defaultValue="2" />
          </div>
          <div>
            <label className="label">طبقه</label>
            <input name="floor" type="number" min="0" className="input" defaultValue="1" />
          </div>
          <div>
            <label className="label">سن بنا</label>
            <input name="age" type="number" min="0" className="input" defaultValue="0" />
          </div>
          <FieldSelect label="وضعیت" name="status" options={statuses} />

          <div>
            <label className="label">نام مالک</label>
            <input name="owner" className="input" placeholder="نام و نام خانوادگی" />
          </div>
          <FieldSelect label="مشاور مسئول" name="agent" options={agents} />

          <div className="md:col-span-2">
            <label className="label">امکانات</label>
            <input name="features" className="input" placeholder="پارکینگ، آسانسور، انباری، بالکن" />
            <p className="mt-1 text-[11px] text-slate-400">امکانات را با ویرگول فارسی «،» جدا کنید.</p>
          </div>

          <div className="md:col-span-2">
            <label className="label">لینک تصویر</label>
            <input name="image" type="url" className="input" placeholder="https://... (اختیاری)" dir="ltr" />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">انصراف</button>
            <button className="btn-primary">ذخیره ملک</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function FieldSelect({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select name={name} className="input" defaultValue={options[0]}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

export function Header({
  title,
  sub,
  action,
  label,
}: {
  title: string;
  sub: string;
  action?: () => void;
  label?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{sub}</p>
      </div>
      {action && (
        <button onClick={action} className="btn-primary">
          <Plus size={18} /> {label}
        </button>
      )}
    </div>
  );
}
