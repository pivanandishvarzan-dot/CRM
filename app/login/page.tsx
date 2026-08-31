'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Building2, KeyRound, LogIn } from 'lucide-react';

export default function LoginPage() {
  const params = useSearchParams();
  const [email, setEmail] = useState('manager@demo.local');
  const [password, setPassword] = useState('demo1234');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const callbackUrl = params.get('callbackUrl') || '/';
    const result = await signIn('credentials', { email, password, twoFactorCode, redirect: false, callbackUrl });
    setLoading(false);
    if (result?.error) return setError('اطلاعات ورود یا کد امنیتی صحیح نیست، یا حساب موقتاً قفل شده است.');
    window.location.href = result?.url || callbackUrl;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4" dir="rtl">
      <form onSubmit={submit} className="card w-full max-w-md p-7">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-white"><Building2 /></div>
          <div><h1 className="text-xl font-bold">ورود به خانه‌یار</h1><p className="text-sm text-slate-500">CRM مدیریت املاک</p></div>
        </div>
        <label htmlFor="login-email" className="mb-2 block text-sm font-medium">ایمیل</label>
        <input id="login-email" name="email" autoComplete="email" className="input mb-4" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <label htmlFor="login-password" className="mb-2 block text-sm font-medium">رمز عبور</label>
        <input id="login-password" name="password" autoComplete="current-password" className="input mb-4" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <label htmlFor="login-2fa" className="mb-2 flex items-center gap-2 text-sm font-medium"><KeyRound size={15}/>کد دومرحله‌ای یا Recovery Code</label>
        <input id="login-2fa" name="twoFactorCode" autoComplete="one-time-code" className="input mb-1" value={twoFactorCode} onChange={e => setTwoFactorCode(e.target.value)} placeholder="در صورت فعال بودن 2FA" />
        <p className="mb-4 text-[11px] text-slate-400">اگر ورود دومرحله‌ای برای حسابت فعال نیست، این فیلد را خالی بگذار.</p>
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" className="btn-primary flex w-full items-center justify-center gap-2" disabled={loading}>
          <LogIn size={18} /> {loading ? 'در حال ورود...' : 'ورود امن'}
        </button>
        <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-500">
          دمو مدیر: manager@demo.local / demo1234<br />
          دمو مشاور: agent@demo.local / demo1234
        </div>
      </form>
    </main>
  );
}
