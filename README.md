# خانه‌یار — CRM فارسی املاک

یک وب‌اپلیکیشن مدرن، راست‌چین و واکنش‌گرا برای مدیریت روزانه آژانس املاک. داشبورد تحلیلی، ملک‌ها، مالک‌ها، متقاضی‌ها، پیگیری‌ها، قراردادها و گزارش عملکرد تیم در نسخه نمایشی بدون هیچ سرویس خارجی در دسترس‌اند.

## امکانات

- داشبورد KPI، نمودار ارزش معاملات و وضعیت ملک‌ها، آخرین ملک‌ها و عملکرد مشاوران
- مدیریت ملک با نمای کارت/جدول، جست‌وجو، فیلتر، افزودن، حذف تأییدی و پرونده کامل
- پرونده مالک و متقاضی با مسئول، تماس، نیازمندی و پیشنهادهای متناسب
- پیگیری تماس، پیام، جلسه، بازدید و وظیفه با اولویت و زمان‌بندی
- قرارداد، مبلغ، کمیسیون، پرداخت و گزارش نرخ تبدیل
- طراحی کامل RTL، منوی موبایل، حالات loading/error/empty و focus قابل دسترس
- مدل داده PostgreSQL/Prisma و نقش‌های `SYSTEM_ADMIN`، `AGENCY_MANAGER` و `AGENT`

## اجرای سریع (Demo Mode)

پیش‌نیاز: Node.js 20 یا جدیدتر.

```bash
npm install
cp .env.example .env.local
npm run dev
```

سپس `http://localhost:3000` را باز کنید. حتی بدون `.env.local` رابط با داده‌های ساختگی فارسی اجرا می‌شود و هیچ شماره یا اطلاعات واقعی در آن نیست. برای build تولیدی:

```bash
npm run typecheck
npm run lint
npm run build
npm start
```

## اتصال PostgreSQL و Prisma

1. یک دیتابیس PostgreSQL بسازید و `DATABASE_URL` را مطابق `.env.example` در `.env.local` قرار دهید.
2. `DEMO_MODE=false` را تنظیم کنید.
3. مدل‌ها را اعمال کنید:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Schema در `prisma/schema.prisma` شامل کاربران و نقش‌ها، آژانس، ملک، مالک، متقاضی، پیگیری و قرارداد است. برای محصول واقعی یک repository/service layer بسازید تا منبع داده نمایشی با Prisma جایگزین شود.

## فعال‌سازی Auth.js

1. با `openssl rand -base64 32` مقدار امن `AUTH_SECRET` تولید کنید؛ آن را commit نکنید.
2. Provider موردنظر (Credentials یا OAuth) را در `auth.ts` اضافه کنید.
3. برای Credentials، رمز را فقط به‌صورت hash ذخیره و اعتبارسنجی کنید؛ برای OAuth، شناسه و secret را در Environment Variables بگذارید.
4. route استاندارد Auth.js را از `handlers` صادر و middleware محافظت از مسیرها را اضافه کنید. در حالت نمایشی، Shell عمداً کاربر نمونه «مهدی اکبری» را نشان می‌دهد تا نبود secret باعث crash نشود.

## استقرار روی Vercel

Repository را در Vercel Import کنید، Framework را Next.js بگذارید و برای Preview نمایشی فقط `DEMO_MODE=true` را تعریف کنید. برای Production، `DATABASE_URL`، `AUTH_SECRET` و `AUTH_TRUST_HOST=true` را در Project Settings اضافه و migration را در pipeline اجرا کنید. Build Command همان `npm run build` است.

## ساختار

- `app/`: routeهای App Router، layout و وضعیت‌های خطا/بارگذاری
- `components/`: Shell، داشبورد و صفحات تعاملی قابل استفاده مجدد
- `lib/demo-data.ts`: داده‌های ساختگی امن و فارسی
- `prisma/schema.prisma`: مدل آماده PostgreSQL
- `auth.ts`: نقطه توسعه Auth.js

> این نسخه frontend-first و Demo Mode است. عملیات فرم‌ها در حافظه مرورگر قابل مشاهده‌اند و پس از refresh بازنشانی می‌شوند؛ برای ماندگاری، service layer را به Prisma متصل کنید.
