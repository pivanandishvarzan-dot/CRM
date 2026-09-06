import './globals.css';
import type {Metadata} from 'next';
import Shell from '@/components/shell';
import {auth} from '@/auth';
import {isDemoMode} from '@/lib/data-mode';

export const metadata:Metadata={title:'خانه‌یار | CRM املاک',description:'سامانه یکپارچه مدیریت ارتباط با مشتری املاک'};

export default async function RootLayout({children}:{children:React.ReactNode}){
  const demo=isDemoMode();
  const session=demo?null:await auth();
  const user=demo
    ? {name:'مدیر آژانس',role:'AGENCY_MANAGER' as const}
    : {name:session?.user?.name||'کاربر',role:session?.user?.role||'AGENT'};

  return <html lang="fa" dir="rtl"><body><Shell user={user} demo={demo}>{children}</Shell></body></html>;
}
