'use client';
import { DatabaseBackup, Download, ShieldCheck, TriangleAlert } from 'lucide-react';

export default function BackupCenter(){
  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold">پشتیبان‌گیری و بازیابی</h1><p className="mt-1 text-sm text-slate-500">خروجی اضطراری داخل CRM و دستورالعمل بازیابی امن Production</p></div>
    <section className="card p-6"><div className="flex items-start gap-4"><div className="rounded-xl bg-brand-50 p-3 text-brand-700"><DatabaseBackup/></div><div className="flex-1"><h2 className="font-bold">Emergency Export</h2><p className="mt-1 text-sm leading-7 text-slate-500">یک Snapshot JSON از کاربران، مالک‌ها، ملک‌ها، متقاضی‌ها، قراردادها و پیگیری‌های مجاز شما دانلود می‌شود. این فایل برای دسترسی اضطراری و انتقال داده مناسب است، اما جای pg_dump کامل دیتابیس را نمی‌گیرد.</p></div></div><a href="/api/backup/emergency" className="btn-primary mt-5 inline-flex"><Download size={17}/>دانلود خروجی اضطراری</a></section>
    <section className="card p-6"><div className="flex items-start gap-4"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><ShieldCheck/></div><div><h2 className="font-bold">بکاپ کامل PostgreSQL</h2><p className="mt-2 text-sm leading-7 text-slate-600">روی محیطی که PostgreSQL client دارد، دستور <code className="rounded bg-slate-100 px-1">npm run backup:db</code> یک فایل dump نسخه‌دار با زمان ایجاد می‌سازد. مسیر ذخیره با <code className="rounded bg-slate-100 px-1">BACKUP_DIR</code> قابل تنظیم است.</p></div></div></section>
    <section className="card border-amber-200 bg-amber-50/40 p-6"><div className="flex items-start gap-4"><TriangleAlert className="mt-1 text-amber-700"/><div><h2 className="font-bold text-amber-900">Restore از UI عمداً غیرفعال است</h2><p className="mt-2 text-sm leading-7 text-amber-900/80">برای جلوگیری از پاک‌شدن تصادفی Production، بازیابی کامل فقط از خط فرمان انجام می‌شود و علاوه بر نام فایل به متغیر <code className="rounded bg-white/70 px-1">CONFIRM_RESTORE=RESTORE</code> نیاز دارد. قبل از Restore باید یک Backup جدید گرفته شود و ترافیک برنامه متوقف شود.</p></div></div></section>
  </div>;
}
