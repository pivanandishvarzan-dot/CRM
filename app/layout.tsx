import './globals.css';
import type { Metadata } from 'next';
import Shell from '@/components/shell';
import AuthProvider from '@/components/auth-provider';

export const metadata: Metadata = {
  title: 'خانه‌یار | CRM املاک',
  description: 'سامانه یکپارچه مدیریت ارتباط با مشتری املاک',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <AuthProvider><Shell>{children}</Shell></AuthProvider>
      </body>
    </html>
  );
}
