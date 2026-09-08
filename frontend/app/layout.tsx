import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ملکینو CRM',
  description: 'سامانه حرفه‌ای مدیریت املاک، مشتریان و قراردادها',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
