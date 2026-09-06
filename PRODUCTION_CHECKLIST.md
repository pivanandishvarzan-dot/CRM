# Production Release Checklist

این چک‌لیست برای اولین استقرار Production خانه‌یار است.

## 1. Environment

- `DEMO_MODE=false`
- `DATABASE_URL` به PostgreSQL واقعی اشاره کند.
- `AUTH_SECRET` یک مقدار تصادفی و طولانی باشد.
- `AUTH_TRUST_HOST=true` فقط در محیطی که به آن نیاز دارد تنظیم شود.
- فایل `.env` و secretها داخل Git commit نشوند.

## 2. Database

### دیتابیس تازه

```bash
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
```

Migrationها باید baseline را ابتدا ایجاد و سپس migrationهای incremental را اجرا کنند.

### دیتابیس قدیمی ساخته‌شده با `prisma db push`

قبل از هر تغییر از دیتابیس backup بگیرید و مطمئن شوید schema موجود با baseline سازگار است. سپس baseline را به‌عنوان applied ثبت کنید و migrationهای بعدی را deploy کنید:

```bash
npx prisma migrate resolve --applied 20260906130000_baseline
npm run prisma:migrate:deploy
```

این دستور `resolve` را روی دیتابیس خالی اجرا نکنید.

## 3. Validation

```bash
npx prisma validate
npm run prisma:generate
npm run typecheck
npm run build
```

تا وقتی این چهار مرحله موفق نشده‌اند Release را تأییدشده تلقی نکنید.

## 4. Start and health

### اجرای مستقیم Node

```bash
npm start
```

### اجرای Docker

یک فایل `.env` فقط روی سرور بسازید و حداقل `DATABASE_URL` و `AUTH_SECRET` را در آن قرار دهید. سپس:

```bash
docker compose build --pull
docker compose up -d
```

Container قبل از اجرای Next.js به‌صورت خودکار `prisma migrate deploy` را اجرا می‌کند. وضعیت Container را با این دستور ببینید:

```bash
docker compose ps
```

برای مشاهده لاگ‌ها:

```bash
docker compose logs -f crm
```

سپس `GET /api/health` را بررسی کنید. انتظار می‌رود HTTP 200 و `status: ok` / `database: ok` برگردد. HTTP 503 یعنی اتصال دیتابیس سالم نیست.

## 5. Smoke test

با یک حساب Manager و در صورت وجود یک حساب Agent این مسیرها را بررسی کنید:

- Login / Logout و جلوگیری از ورود ناشناس به صفحات محافظت‌شده
- Dashboard و نمایش داده واقعی
- Properties: list / create / delete / detail
- Owners: list / create / delete
- Applicants: list / create / delete
- Followups: list / create / complete / delete / calendar
- Contracts: list / create و دسترسی نقش‌ها
- Reports: داده واقعی و محدودیت دسترسی
- Settings: دسترسی Manager/System Admin و جلوگیری از دسترسی Agent
- جداسازی داده‌های Agency و عدم مشاهده داده آژانس دیگر

## 6. Release gate

Release فقط وقتی آماده Production است که همه موارد زیر برقرار باشند:

- migration روی PostgreSQL واقعی موفق باشد؛
- typecheck و production build موفق باشند؛
- `/api/health` سبز باشد؛
- smoke test نقش‌ها و CRUDهای اصلی بدون خطای بحرانی انجام شود؛
- backup/rollback دیتابیس قبل از migration Production آماده باشد.

## Rollback

در صورت شکست migration یا smoke test، rollout را متوقف کنید. در Docker، نسخه قبلی image/commit را دوباره build و اجرا کنید. برای تغییرات مخرب دیتابیس از backup معتبر استفاده کنید. migrationهای اعمال‌شده را بدون بررسی دستی با SQL معکوس نکنید.
