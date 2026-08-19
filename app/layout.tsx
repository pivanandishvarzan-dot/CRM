import './globals.css';import type {Metadata} from 'next';import Shell from '@/components/shell';
export const metadata:Metadata={title:'خانه‌یار | CRM املاک',description:'سامانه یکپارچه مدیریت ارتباط با مشتری املاک'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fa" dir="rtl"><body><Shell>{children}</Shell></body></html>}
