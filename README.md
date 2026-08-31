# خانه‌یار — CRM فارسی املاک

خانه‌یار یک CRM راست‌چین و واکنش‌گرا برای مدیریت آژانس املاک است که علاوه بر Demo Mode، مسیر کامل PostgreSQL/Prisma، احراز هویت، نقش‌ها، Pipeline فروش، Matching متقاضی و ملک، پیگیری، قرارداد، داشبورد مدیریتی، Automation Engine، Storage و Disaster Recovery دارد.

## امکانات اصلی

- مدیریت ملک، مالک، متقاضی، پیگیری و قرارداد روی PostgreSQL
- Matching امتیازی ملک ↔ متقاضی
- Pipeline معاملات از `LEAD` تا `WON` همراه Stage History
- داشبورد و گزارش مدیریتی، Funnel، کمیسیون و عملکرد مشاور
- Auth.js با bcrypt و نقش‌های `SYSTEM_ADMIN`، `AGENCY_MANAGER` و `AGENT`
- Data Scope سمت سرور برای جداسازی داده مشاورها و آژانس‌ها
- Automation Builder با ساختار `WHEN → IF → THEN`
- Queue پایدار، اجرای تأخیردار، Retry و Job Monitoring
- Import/Export Excel و Emergency JSON Export
- S3-compatible Object Storage برای تصاویر و مدارک ملک
- Backup/Restore کامل PostgreSQL با `pg_dump` و `pg_restore`
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

STORAGE_BUCKET="crm-private"
STORAGE_REGION="auto"
STORAGE_ENDPOINT="https://YOUR_S3_COMPATIBLE_ENDPOINT"
STORAGE_ACCESS_KEY_ID="..."
STORAGE_SECRET_ACCESS_KEY="..."
STORAGE_FORCE_PATH_STYLE=false
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

## Scheduler اتوماسیون

`vercel.json` اجرای `/api/jobs/run?limit=50` را هر پنج دقیقه زمان‌بندی می‌کند. Endpoint فقط درخواست دارای هدر زیر را قبول می‌کند:

```text
Authorization: Bearer $CRON_SECRET
```

## Object Storage

آپلود تصاویر و مدارک با Presigned URL مستقیماً از مرورگر به یک Storage سازگار با S3 انجام می‌شود. Bucket می‌تواند Private باشد؛ فایل‌ها از مسیر داخلی CRM و با لینک موقت مشاهده می‌شوند. CORS Bucket باید دامنه CRM را برای `PUT` مجاز کند.

## Backup و Disaster Recovery

### بکاپ کامل دیتابیس

روی سیستمی که PostgreSQL client tools نصب دارد:

```bash
npm run backup:db
```

این دستور با `pg_dump --format=custom` یک فایل نسخه‌دار داخل `backups/` می‌سازد. مسیر را می‌توان با `BACKUP_DIR` تغییر داد.

پیشنهاد Production: حداقل یک بکاپ روزانه، نگهداری ۳۰ نسخه روزانه و چند نسخه هفتگی/ماهانه در Storage جدا از دیتابیس اصلی. بکاپی که روی همان سرور دیتابیس باقی بماند Disaster Recovery واقعی محسوب نمی‌شود.

### Emergency Export

مدیر می‌تواند از صفحه `/backup` یک Snapshot JSON از داده‌های مجاز آژانس بگیرد. این خروجی برای دسترسی اضطراری، بررسی داده و مهاجرت مفید است اما جای `pg_dump` کامل را نمی‌گیرد.

### Restore کامل

Restore از UI عمداً وجود ندارد. قبل از Restore:

1. ترافیک برنامه را متوقف کنید.
2. از وضعیت فعلی یک بکاپ جدید بگیرید.
3. فایل dump موردنظر را به محیط امن بازیابی منتقل کنید.
4. ابتدا در یک دیتابیس staging بازیابی و صحت داده را بررسی کنید.

برای اجرای Restore:

```bash
CONFIRM_RESTORE=RESTORE npm run restore:db -- backups/crm-YYYY-MM-DD.dump
npm run prisma:migrate
```

`restore:db` از `pg_restore --clean --if-exists` استفاده می‌کند و عملیات مخرب است. هرگز آن را روی Production بدون تست بکاپ و تأیید Recovery Point اجرا نکنید.

### Recovery اهداف پیشنهادی

برای نسخه اولیه CRM: هدف عملی مناسب `RPO <= 24h` و `RTO <= 4h` است. با بکاپ‌های ساعتی یا PITR سرویس دیتابیس می‌توان RPO را بعداً کاهش داد.

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
- `lib/storage.ts`: S3-compatible storage abstraction
- `lib/data-scope.ts`: محدودسازی داده براساس نقش و آژانس
- `lib/date.ts` و `lib/jalali.ts`: نمایش و ورود تاریخ شمسی
- `lib/matching/`: موتور Matching
- `scripts/backup-db.mjs`: بکاپ کامل PostgreSQL
- `scripts/restore-db.mjs`: بازیابی محافظت‌شده PostgreSQL
- `auth.ts`: Auth.js Credentials/JWT
- `middleware.ts`: محافظت مسیرها
- `prisma/schema.prisma`: مدل داده
- `prisma/migrations/`: migrationهای نسخه‌بندی‌شده
- `prisma/seed.mjs`: داده اولیه توسعه/تست

## استقرار

برای Production متغیرهای دیتابیس، Auth، Cron و Storage را تعریف کنید و قبل از شروع نسخه جدید `npm run prisma:migrate` اجرا شود. Build Command همان `npm run build` است.
