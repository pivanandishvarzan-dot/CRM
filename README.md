# خانه‌یار — CRM فارسی املاک

خانه‌یار یک CRM راست‌چین و واکنش‌گرا برای مدیریت آژانس املاک است. نسخه فعلی علاوه بر Demo Mode، لایه‌های واقعی API/Repository، PostgreSQL/Prisma، Auth.js، RBAC، multi-tenancy آژانس، قراردادها، گزارش‌ها و migration دیتابیس را دارد.

## امکانات اصلی

- داشبورد KPI و وضعیت ملک‌ها
- مدیریت ملک، مالک، متقاضی و پرونده ملک
- پیگیری تماس، پیام، جلسه، بازدید و وظیفه
- قرارداد، کمیسیون و وضعیت قرارداد
- گزارش عملکرد و رتبه‌بندی مشاوران
- نقش‌های `SYSTEM_ADMIN`، `AGENCY_MANAGER` و `AGENT`
- جداسازی داده‌ها در سطح آژانس و سطح مشاور برای بخش‌های حساس
- Demo Mode مستقل از دیتابیس
- migration کنترل‌شده Prisma برای Production

## اجرای سریع در Demo Mode

پیش‌نیاز: Node.js 20 یا جدیدتر.

```bash
npm install
cp .env.example .env.local
npm run dev
```

اگر `DATABASE_URL` تنظیم نشده باشد یا `DEMO_MODE` برابر `false` نباشد، برنامه در Demo Mode اجرا می‌شود.

## اجرای Production

متغیرهای اصلی:

```env
DEMO_MODE=false
DATABASE_URL=postgresql://...
AUTH_SECRET=...
AUTH_TRUST_HOST=true
```

سپس:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate:status
npm run prisma:migrate:deploy
npm run typecheck
npm run build
npm start
```

> اگر دیتابیس قبلاً با `prisma db push` ساخته شده، قبل از اولین `prisma migrate deploy` باید وضعیت baseline/migration history بررسی شود. migration فعلی فقط تغییرات جدید schema را اعمال می‌کند و جایگزین بررسی baseline نیست.

## احراز هویت و دسترسی

Auth.js با Credentials فعال است. رمزها با PBKDF2 ذخیره می‌شوند و middleware مسیرهای CRM را در Production محافظت می‌کند. اطلاعات کاربر و نقش در Shell از session واقعی خوانده می‌شود. Demo Mode fallback نمایشی جداگانه دارد.

سطوح دسترسی:

- `SYSTEM_ADMIN`: دسترسی سراسری
- `AGENCY_MANAGER`: مدیریت داده‌های آژانس خود، کاربران، تنظیمات، قرارداد و گزارش‌ها
- `AGENT`: دسترسی به عملیات روزمره و داده‌های مجاز مشاور

## Prisma

فایل اصلی schema:

```text
prisma/schema.prisma
```

migrationها:

```text
prisma/migrations/
```

دستورات مفید:

```bash
npm run prisma:generate
npm run prisma:migrate:status
npm run prisma:migrate:deploy
```

## استقرار روی Vercel یا سرور Node

برای Production، Environment Variables بالا را تنظیم کنید. Build Command:

```bash
npm run prisma:generate && npm run build
```

Migration بهتر است به‌عنوان مرحله جداگانه قبل از rollout اجرا شود:

```bash
npm run prisma:migrate:deploy
```

برای Preview نمایشی می‌توان فقط `DEMO_MODE=true` را استفاده کرد.

## کنترل کیفیت قبل از Release

حداقل این مسیرها باید بررسی شوند:

```bash
npm run prisma:generate
npm run typecheck
npm run build
```

و به‌صورت دستی:

- Login و Logout
- دسترسی Roleها
- CRUD ملک
- ثبت/حذف مالک و متقاضی
- پیگیری‌ها
- قراردادها
- گزارش‌ها
- جداسازی داده بین آژانس‌ها

CI پروژه همین validationهای اصلی را اجرا می‌کند؛ تا زمانی که یک workflow موفق ثبت نشده، نباید Build را تأییدشده فرض کرد.
