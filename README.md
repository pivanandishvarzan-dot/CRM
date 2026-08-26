# خانه‌یار — CRM فارسی املاک

خانه‌یار یک CRM راست‌چین و واکنش‌گرا برای مدیریت آژانس املاک است که علاوه بر Demo Mode، مسیر کامل PostgreSQL/Prisma، احراز هویت، نقش‌ها، Pipeline فروش، Matching متقاضی و ملک، پیگیری، قرارداد، داشبورد مدیریتی، Automation Engine و Object Storage دارد.

## امکانات اصلی

- مدیریت ملک، مالک، متقاضی، پیگیری و قرارداد روی PostgreSQL
- Matching امتیازی ملک ↔ متقاضی
- Pipeline معاملات از `LEAD` تا `WON` همراه Stage History
- داشبورد و گزارش مدیریتی، Funnel، کمیسیون و عملکرد مشاور
- Auth.js با bcrypt و نقش‌های `SYSTEM_ADMIN`، `AGENCY_MANAGER` و `AGENT`
- Data Scope سمت سرور برای جداسازی داده مشاورها و آژانس‌ها
- Automation Builder با ساختار `WHEN → IF → THEN`
- Queue پایدار، اجرای تأخیردار، Retry و Job Monitoring
- آپلود امن تصاویر و مدارک ملک روی Object Storage سازگار با S3
- تمام تاریخ‌های قابل مشاهده و قابل ورود در UI به صورت شمسی؛ ذخیره داخلی تاریخ‌ها ISO/UTC است
- Demo fallback برای اجرا بدون PostgreSQL

## اجرای سریع در Demo Mode

پیش‌نیاز: Node.js 20 یا جدیدتر.

```bash
npm install
cp .env.example .env.local
npm run dev
```

در `.env.local` مقدار `DEMO_MODE=true` بماند. حساب‌های نمونه:

```text
manager@demo.local / demo1234
agent@demo.local   / demo1234
```

## اجرای واقعی با PostgreSQL

```env
DEMO_MODE=false
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/crm?schema=public"
AUTH_SECRET="YOUR_SECURE_SECRET"
AUTH_TRUST_HOST=true
CRON_SECRET="A_LONG_RANDOM_SECRET"
SEED_PASSWORD="A_SECURE_LOCAL_SEED_PASSWORD"
```

سپس:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Seed از bcrypt با cost 12 استفاده می‌کند. `SEED_PASSWORD` فقط برای محیط توسعه/آزمایش است و در Production باید حساب‌های واقعی با رمزهای امن ایجاد شوند.

## Object Storage برای تصاویر و مدارک

Storage از API سازگار با S3 استفاده می‌کند و با AWS S3، Cloudflare R2 و سرویس‌های مشابه قابل استفاده است. فایل مستقیماً از مرورگر با Presigned URL آپلود می‌شود و Bucket لازم نیست Public باشد.

```env
STORAGE_BUCKET="crm-media"
STORAGE_REGION="auto"
STORAGE_ENDPOINT="https://YOUR_S3_COMPATIBLE_ENDPOINT"
STORAGE_ACCESS_KEY_ID="YOUR_ACCESS_KEY"
STORAGE_SECRET_ACCESS_KEY="YOUR_SECRET_KEY"
STORAGE_FORCE_PATH_STYLE=false
```

برای AWS S3 معمولاً `STORAGE_ENDPOINT` لازم نیست و `STORAGE_REGION` باید Region واقعی Bucket باشد. تصاویر `JPG/PNG/WEBP` تا ۱۰MB و مدارک `PDF/JPG/PNG/WEBP` تا ۲۰MB پذیرفته می‌شوند. URL ذخیره‌شده در CRM داخلی است و دانلود فایل بعد از بررسی Session و Data Scope با لینک امضاشده موقت انجام می‌شود.

## Scheduler اتوماسیون

`vercel.json` اجرای `/api/jobs/run?limit=50` را هر پنج دقیقه زمان‌بندی می‌کند. Endpoint فقط درخواست دارای هدر زیر را قبول می‌کند:

```text
Authorization: Bearer $CRON_SECRET
```

در Vercel کافی است `CRON_SECRET` را در Environment Variables تعریف کنید. اگر روی سرویس دیگری Deploy می‌کنید، Scheduler خارجی باید همین endpoint را با همان Bearer token فراخوانی کند.

## بررسی کیفیت قبل از Merge یا Deploy

```bash
npm run prisma:validate
npm run prisma:generate
npm run typecheck
npm run build
npm run test:e2e
```

یا مراحل اصلی Build:

```bash
npm run verify
```

GitHub Actions با PostgreSQL واقعی migration، seed، typecheck، production build و Playwright E2E را اجرا می‌کند.

## معماری

- `app/`: Next.js App Router و API routes
- `components/`: UI و صفحات تعاملی
- `lib/repositories/`: persistence و Data Access
- `lib/automation/`: Event Dispatcher و Job Queue
- `lib/storage.ts`: Object Storage و Presigned URL
- `lib/data-scope.ts`: محدودسازی داده براساس نقش و آژانس
- `lib/date.ts` و `lib/jalali.ts`: نمایش و ورود تاریخ شمسی
- `lib/matching/`: موتور Matching
- `auth.ts`: Auth.js Credentials/JWT
- `middleware.ts`: محافظت مسیرها
- `prisma/schema.prisma`: مدل داده
- `prisma/migrations/`: migrationهای نسخه‌بندی‌شده
- `prisma/seed.mjs`: داده اولیه توسعه/تست

## استقرار

برای Production متغیرهای دیتابیس، Auth، Cron و Storage را تعریف کنید و قبل از شروع نسخه جدید `npm run prisma:migrate` اجرا شود. Build Command همان `npm run build` است.
