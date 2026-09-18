# سینا نور — بک‌اند (Cloudflare Workers + D1)

پیاده‌سازی API واقعی برای فروشگاه سینا نور: احراز هویت با **شماره موبایل + رمز عبور** (به‌جای OTP)، محصولات، دسته‌بندی‌ها، سفارش‌ها و مدیریت کاربران — همگی از طریق یک Worker با دیتابیس D1 (SQLite روی Cloudflare).

## پیش‌نیاز
```bash
npm install -g wrangler
wrangler login
```

## راه‌اندازی

1) ساخت دیتابیس D1:
```bash
wrangler d1 create sina-noor-db
```
خروجی شامل `database_id` است؛ آن را در `wrangler.toml` جای‌گزین `REPLACE_WITH_YOUR_D1_DATABASE_ID` کنید.

2) اجرای اسکیمای دیتابیس:
```bash
npm run db:init          # روی D1 لوکال برای تست
npm run db:init:remote   # روی D1 واقعی کلادفلر
```

3) تنظیم مقادیر محرمانه:
```bash
wrangler secret put JWT_SECRET
# یک رشته‌ی تصادفی و طولانی وارد کنید (مثلاً با: openssl rand -hex 32)
```

4) اجرا در حالت توسعه:
```bash
npm run dev
```

5) دیپلوی:
```bash
npm run deploy
```
سپس در داشبورد Cloudflare، یک Route مثل `api.sinanoor.com/*` را به این Worker متصل کنید (یا از `workers.dev` پیش‌فرض استفاده کنید).

## نکته‌ی مهم امنیتی
اولین کاربری که با `/api/auth/register` ثبت‌نام می‌کند به‌صورت خودکار **ادمین** می‌شود (برای راه‌اندازی اولیه‌ی سیستم بدون دسترسی مستقیم به دیتابیس). بعد از ساخت اولین ادمین، پیشنهاد می‌شود این رفتار را در `src/routes/auth.js` غیرفعال یا محدود کنید.

## خلاصه‌ی API

| متد | مسیر | توضیح | نیاز به توکن |
|---|---|---|---|
| POST | `/api/auth/register` | ثبت‌نام (نام، موبایل، رمز عبور) | - |
| POST | `/api/auth/login` | ورود (موبایل، رمز عبور) | - |
| GET | `/api/auth/me` | اطلاعات کاربر جاری | کاربر |
| GET | `/api/products` | لیست محصولات (فیلتر: category, deal, q) | - |
| GET | `/api/products/:id` | جزئیات یک محصول | - |
| POST | `/api/products` | افزودن محصول | ادمین |
| PUT | `/api/products/:id` | ویرایش محصول | ادمین |
| DELETE | `/api/products/:id` | حذف محصول | ادمین |
| GET | `/api/categories` | لیست دسته‌بندی‌ها | - |
| POST/PUT/DELETE | `/api/categories(/:id)` | مدیریت دسته‌بندی | ادمین |
| POST | `/api/orders` | ثبت سفارش جدید | کاربر |
| GET | `/api/orders/mine` | سفارش‌های من | کاربر |
| GET | `/api/admin/orders` | همه سفارش‌ها (فیلتر status) | ادمین |
| PATCH | `/api/admin/orders/:id` | تغییر وضعیت سفارش | ادمین |
| GET | `/api/admin/users` | لیست کاربران | ادمین |
| PATCH | `/api/admin/users/:id` | تغییر نقش کاربر | ادمین |
| DELETE | `/api/admin/users/:id` | حذف کاربر | ادمین |

توکن با هدر `Authorization: Bearer <token>` ارسال می‌شود؛ توکن از پاسخ `login`/`register` برگردانده می‌شود.

## CORS
دامنه‌های مجاز در `wrangler.toml` زیر `ALLOWED_ORIGINS` تنظیم می‌شوند (دامنه فروشگاه + ساب‌دامنه ادمین). این مقدار را قبل از دیپلوی نهایی با دامنه‌های واقعی خودتان به‌روزرسانی کنید.
