# خانه‌یار — CRM فارسی املاک

خانه‌یار یک CRM راست‌چین و واکنش‌گرا برای مدیریت آژانس املاک است که اکنون علاوه بر Demo Mode، مسیر کامل PostgreSQL/Prisma، احراز هویت، نقش‌ها، Pipeline فروش، Matching متقاضی و ملک، پیگیری، قرارداد و داشبورد مدیریتی را دارد.

## امکانات اصلی

- مدیریت ملک: ثبت، ویرایش، حذف، جست‌وجو، فیلتر و پرونده کامل
- مالک‌ها و مشاوران متصل به رکوردهای واقعی دیتابیس
- متقاضی‌ها با نیازهای ساخت‌یافته و Matching امتیازی ملک‌ها
- Pipeline معاملات از `LEAD` تا `WON`
- پیگیری تماس، پیام، جلسه، بازدید و وظیفه با تاریخ و وضعیت واقعی
- قرارداد، مبلغ، کمیسیون و وضعیت معامله
- داشبورد مدیریتی با Funnel، نرخ تبدیل، ارزش قرارداد و عملکرد مشاور
- Auth.js با نقش‌های `SYSTEM_ADMIN`، `AGENCY_MANAGER` و `AGENT`
- Data Scope سمت سرور برای جلوگیری از دسترسی مشاور به داده‌های سایر کاربران
- Demo fallback برای اجرا بدون PostgreSQL

## اجرای سریع در Demo Mode

پیش‌نیاز: Node.js 20 یا جدیدتر.

```bash
npm install
cp .env.example .env.local
npm run dev
```

در `.env.local` مقدار `DEMO_MODE=true` بماند. سپس `http://localhost:3000` را باز کنید.

حساب‌های نمونه:

```text
manager@demo.local / demo1234
agent@demo.local   / demo1234
```

## اجرای واقعی با PostgreSQL

ابتدا `.env.local` را تنظیم کنید:

```env
DEMO_MODE=false
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/crm?schema=public"
AUTH_SECRET="YOUR_SECURE_SECRET"
AUTH_TRUST_HOST=true
```

سپس:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Migration اولیه در `prisma/migrations` نسخه‌بندی شده و Seed نیز در `prisma/seed.mjs` قرار دارد.

> Seed فقط برای توسعه محلی است. رمزهای seed با پیشوند `plain:` ذخیره می‌شوند و نباید در Production استفاده شوند. قبل از انتشار عمومی، Credentials باید با bcrypt یا Argon2 و password hashing استاندارد جایگزین شود.

## بررسی کیفیت قبل از Merge یا Deploy

```bash
npm run prisma:validate
npm run prisma:generate
npm run typecheck
npm run build
```

یا همه موارد با یک دستور:

```bash
npm run verify
```

GitHub Actions در `.github/workflows/ci.yml` همین مراحل را برای Pull Requestها و push به `main` اجرا می‌کند.

## معماری

- `app/`: Next.js App Router و API routes
- `components/`: UI و صفحات تعاملی
- `lib/repositories/`: دسترسی به داده و منطق persistence
- `lib/data-scope.ts`: محدودسازی داده براساس نقش و آژانس
- `lib/matching/`: موتور Matching ملک و متقاضی
- `auth.ts`: Auth.js Credentials/JWT
- `middleware.ts`: محافظت مسیرها و دسترسی صفحات مدیریتی
- `prisma/schema.prisma`: مدل داده
- `prisma/migrations/`: migrationهای نسخه‌بندی‌شده
- `prisma/seed.mjs`: داده اولیه محیط توسعه

## استقرار

برای Production متغیرهای `DATABASE_URL`، `AUTH_SECRET` و `AUTH_TRUST_HOST=true` را در محیط استقرار تعریف کنید و قبل از شروع نسخه جدید، `npm run prisma:migrate` اجرا شود. Build Command همان `npm run build` است.
