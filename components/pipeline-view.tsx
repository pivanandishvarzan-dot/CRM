'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Phone, UserRoundSearch } from 'lucide-react';
import { Header } from './properties-view';
import { Badge } from './ui';

type Applicant = {
  id: string;
  name: string;
  phone: string;
  requestType: string;
  budgetMax?: number | null;
  urgency: number;
  status: string;
  agent?: { id: string; name: string } | null;
};

type Stage = { key: string; label: string; hint: string };

const stages: Stage[] = [
  { key: 'LEAD', label: 'سرنخ', hint: 'ورودی جدید' },
  { key: 'CONTACTED', label: 'تماس اولیه', hint: 'ارتباط برقرار شده' },
  { key: 'QUALIFIED', label: 'نیازسنجی', hint: 'نیاز و بودجه مشخص' },
  { key: 'MATCHING', label: 'پیشنهاد ملک', hint: 'فایل‌های مناسب ارسال شده' },
  { key: 'VISIT', label: 'بازدید', hint: 'بازدید هماهنگ یا انجام شده' },
  { key: 'NEGOTIATION', label: 'مذاکره', hint: 'در حال چانه‌زنی' },
  { key: 'CONTRACT', label: 'قرارداد', hint: 'در مرحله قرارداد' },
  { key: 'WON', label: 'نهایی‌شده', hint: 'معامله موفق' },
];

function urgencyTone(value: number): 'red'|'amber'|'gray' { return value >= 4 ? 'red' : value === 3 ? 'amber' : 'gray'; }
function urgencyLabel(value: number) { return value >= 4 ? 'فوری' : value === 3 ? 'زیاد' : value === 2 ? 'متوسط' : 'کم'; }

export default function PipelineView() {
  const [rows, setRows] = useState<Applicant[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/applicants').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setRows(data);
      else setError(data.error || 'خطا در دریافت Pipeline');
    }).catch(() => setError('خطا در دریافت Pipeline')).finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => Object.fromEntries(stages.map(stage => [stage.key, rows.filter(row => row.status === stage.key).length])), [rows]);

  async function move(item: Applicant, direction: -1 | 1) {
    const index = stages.findIndex(stage => stage.key === item.status);
    const next = stages[index + direction];
    if (!next) return;

    setError('');
    const previousStatus = item.status;
    setRows(current => current.map(row => row.id === item.id ? { ...row, status: next.key } : row));

    const response = await fetch(`/api/applicants/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next.key }),
    });
    if (!response.ok) {
      setRows(current => current.map(row => row.id === item.id ? { ...row, status: previousStatus } : row));
      setError('جابجایی مرحله ذخیره نشد.');
    }
  }

  return <>
    <Header title="Pipeline معاملات" sub="مسیر هر سرنخ از اولین تماس تا نهایی شدن معامله" />
    {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {loading ? <div className="card p-10 text-center text-sm text-slate-500">در حال دریافت Pipeline...</div> :
      <div className="overflow-x-auto pb-4">
        <div className="grid min-w-[2100px] grid-cols-8 gap-4">
          {stages.map((stage, stageIndex) => <section key={stage.key} className="rounded-2xl bg-slate-100/70 p-3">
            <div className="mb-3 flex items-start justify-between px-1">
              <div><h2 className="font-bold">{stage.label}</h2><p className="mt-1 text-[11px] text-slate-500">{stage.hint}</p></div>
              <span className="grid h-7 min-w-7 place-items-center rounded-full bg-white px-2 text-xs font-bold text-slate-600">{counts[stage.key] || 0}</span>
            </div>
            <div className="space-y-3">
              {rows.filter(row => row.status === stage.key).map(item => <article key={item.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><UserRoundSearch size={18}/></span>
                  <div className="min-w-0 flex-1"><b className="block truncate text-sm">{item.name}</b><p className="mt-1 text-[11px] text-slate-500">{item.requestType} · {item.agent?.name || 'بدون مشاور'}</p></div>
                </div>
                <div className="mt-3 flex items-center justify-between"><Badge tone={urgencyTone(item.urgency)}>{urgencyLabel(item.urgency)}</Badge><span className="text-xs text-slate-500">{item.budgetMax ? `تا ${item.budgetMax} میلیارد` : 'بودجه نامشخص'}</span></div>
                <a href={`tel:${item.phone.replace(/\s/g,'')}`} className="mt-3 flex items-center gap-1 text-xs text-brand-700"><Phone size={13}/>{item.phone}</a>
                <div className="mt-4 flex gap-2 border-t pt-3">
                  <button disabled={stageIndex === 0} onClick={() => move(item, -1)} className="btn-secondary flex-1 disabled:cursor-not-allowed disabled:opacity-40"><ArrowRight size={15}/>قبلی</button>
                  <button disabled={stageIndex === stages.length - 1} onClick={() => move(item, 1)} className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-40">بعدی<ArrowLeft size={15}/></button>
                </div>
              </article>)}
              {!rows.some(row => row.status === stage.key) && <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-5 text-center text-xs text-slate-400">موردی در این مرحله نیست</div>}
            </div>
          </section>)}
        </div>
      </div>}
  </>;
}
