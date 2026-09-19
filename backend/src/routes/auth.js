import { json, error, HttpError, requireAuth } from "../http.js";
import { hashPassword, verifyPassword, signToken } from "../crypto.js";

const PHONE_RE = /^09\d{9}$/;

function normalizePhone(value) {
  return String(value || "")
    .replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[\s()-]/g, "")
    .replace(/^\+98/, "0");
}

function assertAuthConfig(env) {
  if (!env.DATABASE_URL || !env.DB) throw new HttpError("اتصال Neon تنظیم نشده است؛ DATABASE_URL را در Vercel اضافه کنید", 503);
  if (!env.JWT_SECRET || String(env.JWT_SECRET).length < 32) {
    throw new HttpError("کلید امنیتی ورود تنظیم نشده است", 503);
  }
}

export async function register(request, env) {
  assertAuthConfig(env);
  const body = await request.json().catch(() => ({}));
  const name = (body.name || "").trim();
  const phone = normalizePhone(body.phone);
  const password = body.password || "";

  if (!name || name.length < 2) return error("نام معتبر وارد کنید");
  if (!PHONE_RE.test(phone)) return error("شماره موبایل معتبر نیست (مثال: 09121234567)");
  if (!password || password.length < 6) return error("رمز عبور باید حداقل ۶ کاراکتر باشد");

  const existing = await env.DB.prepare("SELECT id FROM users WHERE phone = ?").bind(phone).first();
  if (existing) return error("این شماره موبایل قبلاً ثبت‌نام کرده است", 409);

  const { hash, salt } = await hashPassword(password);
  // اولین کاربر ثبت‌شده در سیستم به‌صورت خودکار ادمین می‌شود (راه‌اندازی اولیه)
  const countRow = await env.DB.prepare("SELECT COUNT(*) as c FROM users").first();
  const role = countRow.c === 0 ? "admin" : "user";

  const result = await env.DB.prepare(
    "INSERT INTO users (name, phone, password_hash, password_salt, role) VALUES (?, ?, ?, ?, ?)"
  ).bind(name, phone, hash, salt, role).run();

  const uid = result.meta.last_row_id;
  const token = await signToken({ uid, role, name }, env.JWT_SECRET);
  return json({ ok: true, token, user: { id: uid, name, phone, role } });
}

export async function login(request, env) {
  assertAuthConfig(env);
  const body = await request.json().catch(() => ({}));
  const phone = normalizePhone(body.phone);
  const password = body.password || "";

  if (!PHONE_RE.test(phone) || !password) return error("شماره موبایل یا رمز عبور نامعتبر است");

  const user = await env.DB.prepare(
    "SELECT id, name, phone, password_hash, password_salt, role FROM users WHERE phone = ?"
  ).bind(phone).first();

  if (!user) return error("کاربری با این مشخصات یافت نشد", 401);

  const valid = await verifyPassword(password, user.password_salt, user.password_hash);
  if (!valid) return error("رمز عبور اشتباه است", 401);

  const token = await signToken({ uid: user.id, role: user.role, name: user.name }, env.JWT_SECRET);
  return json({
    ok: true,
    token,
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
  });
}

export async function me(request, env) {
  const authUser = await requireAuth(request, env);
  const user = await env.DB.prepare("SELECT id, name, phone, role, created_at FROM users WHERE id = ?")
    .bind(authUser.uid).first();
  if (!user) throw new HttpError("کاربر یافت نشد", 404);
  return json({ ok: true, user });
}
