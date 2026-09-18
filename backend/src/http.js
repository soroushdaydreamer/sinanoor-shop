import { verifyToken } from "./crypto.js";

export function corsHeaders(request, env) {
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim());
  const origin = request.headers.get("Origin") || "";
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}

export function json(data, init = {}, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

export function error(message, status = 400, extraHeaders = {}) {
  return json({ ok: false, error: message }, { status }, extraHeaders);
}

// از هدر Authorization: Bearer <token> کاربر را استخراج می‌کند
export async function getUserFromRequest(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const payload = await verifyToken(token, env.JWT_SECRET);
  if (!payload) return null;
  return payload; // { uid, role, name, exp }
}

export async function requireAuth(request, env) {
  const user = await getUserFromRequest(request, env);
  if (!user) throw new HttpError("لطفاً وارد حساب کاربری خود شوید", 401);
  return user;
}

export async function requireAdmin(request, env) {
  const user = await requireAuth(request, env);
  if (user.role !== "admin") throw new HttpError("دسترسی غیرمجاز — فقط مدیر", 403);
  return user;
}

export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
