'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  FileSignature,
  LayoutDashboard,
  Menu,
  PhoneCall,
  Plus,
  Search,
  Settings,
  UserRoundSearch,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const navigation: NavItem[] = [
  { href: '/', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/properties', label: 'ملک‌ها', icon: Building2 },
  { href: '/owners', label: 'مالک‌ها', icon: Users },
  { href: '/applicants', label: 'متقاضی‌ها', icon: UserRoundSearch },
  { href: '/followups', label: 'پیگیری‌ها', icon: PhoneCall },
  { href: '/followups?tab=calendar', label: 'جلسات و بازدیدها', icon: CalendarDays },
  { href: '/contracts', label: 'قراردادها', icon: FileSignature },
  { href: '/reports', label: 'گزارش‌ها', icon: BarChart3 },
  { href: '/settings', label: 'تنظیمات', icon: Settings },
];

function isActive(pathname: string, href: string) {
  const basePath = href.split('?')[0];
  if (basePath === '/') return pathname === '/';
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/60">
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 border-l border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Building2 />
          </div>
          <div>
            <b className="text-lg">خانه‌یار</b>
            <p className="text-[11px] text-slate-500">مدیریت هوشمند املاک</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="بستن منو"
            className="mr-auto rounded-lg p-1.5 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-1 px-3" aria-label="منوی اصلی">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                onClick={() => setSidebarOpen(false)}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  active
                    ? 'bg-brand-50 font-bold text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={19} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-5 inset-x-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">م</div>
            <div className="text-xs">
              <b>مهدی اکبری</b>
              <p className="mt-1 text-slate-500">مدیر آژانس · نمایشی</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="بستن منو"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
        />
      )}

      <main className="mobile-pad lg:mr-64">
        <header className="sticky top-0 z-20 flex h-20 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur md:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="باز کردن منو"
            className="rounded-xl p-2 hover:bg-slate-100 lg:hidden"
          >
            <Menu />
          </button>

          <div className="relative hidden w-full max-w-md md:block">
            <Search className="absolute right-3 top-2.5 text-slate-400" size={20} />
            <input
              className="input pr-10"
              placeholder="جست‌وجوی ملک، مالک یا متقاضی..."
              aria-label="جست‌وجوی سراسری"
            />
          </div>

          <span className="mr-auto badge bg-brand-50 text-brand-700">حالت نمایشی</span>
          <button type="button" aria-label="اعلان‌ها" className="relative rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50">
            <Bell size={20} />
            <i className="absolute left-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>
        </header>

        <div className="p-4 md:p-8">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t bg-white lg:hidden" aria-label="منوی موبایل">
        {navigation.slice(0, 4).map(({ href, label, icon: Icon }) => (
          <Link
            href={href}
            key={href}
            className={`flex flex-col items-center gap-1 text-[10px] ${
              isActive(pathname, href) ? 'text-brand-700' : 'text-slate-500'
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
        <Link
          href="/properties"
          aria-label="ثبت ملک جدید"
          className="-mt-8 grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/20"
        >
          <Plus />
        </Link>
      </nav>
    </div>
  );
}
