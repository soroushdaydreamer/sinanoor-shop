import { json, error, HttpError, requireAdmin } from "../http.js";

export async function listUsersAdmin(request, env) {
  await requireAdmin(request, env);
  const { results } = await env.DB.prepare(
    "SELECT id, name, phone, role, created_at FROM users ORDER BY id DESC"
  ).all();
  return json({ ok: true, users: results });
}

export async function updateUserRoleAdmin(request, env, params) {
  const admin = await requireAdmin(request, env);
  const b = await request.json().catch(() => ({}));
  if (!["user", "admin"].includes(b.role)) return error("نقش نامعتبر است");

  if (Number(params.id) === admin.uid && b.role !== "admin") {
    return error("نمی‌توانید نقش ادمین خودتان را کاهش دهید");
  }

  const existing = await env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(params.id).first();
  if (!existing) throw new HttpError("کاربر یافت نشد", 404);

  await env.DB.prepare("UPDATE users SET role = ? WHERE id = ?").bind(b.role, params.id).run();
  return json({ ok: true });
}

export async function deleteUserAdmin(request, env, params) {
  const admin = await requireAdmin(request, env);
  if (Number(params.id) === admin.uid) return error("نمی‌توانید حساب خودتان را حذف کنید");
  await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
}
