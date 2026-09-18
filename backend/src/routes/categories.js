import { json, error, HttpError, requireAdmin } from "../http.js";

function slugify(str) {
  return (str || "").trim().toLowerCase()
    .replace(/[^a-z0-9آ-ی\s-]/g, "")
    .replace(/\s+/g, "-");
}

export async function listCategories(request, env) {
  const { results } = await env.DB.prepare("SELECT * FROM categories ORDER BY sort_order ASC, id ASC").all();
  return json({ ok: true, categories: results });
}

export async function createCategory(request, env) {
  await requireAdmin(request, env);
  const b = await request.json().catch(() => ({}));
  if (!b.name) return error("نام دسته‌بندی الزامی است");
  const slug = b.slug ? slugify(b.slug) : slugify(b.name);

  const result = await env.DB.prepare(
    "INSERT INTO categories (name, slug, icon, sort_order) VALUES (?, ?, ?, ?)"
  ).bind(b.name, slug, b.icon || null, b.sort_order || 0).run();

  return json({ ok: true, id: result.meta.last_row_id });
}

export async function updateCategory(request, env, params) {
  await requireAdmin(request, env);
  const b = await request.json().catch(() => ({}));
  const existing = await env.DB.prepare("SELECT id FROM categories WHERE id = ?").bind(params.id).first();
  if (!existing) throw new HttpError("دسته‌بندی یافت نشد", 404);

  await env.DB.prepare(
    "UPDATE categories SET name=?, slug=?, icon=?, sort_order=? WHERE id=?"
  ).bind(b.name, b.slug ? slugify(b.slug) : slugify(b.name), b.icon || null, b.sort_order || 0, params.id).run();

  return json({ ok: true });
}

export async function deleteCategory(request, env, params) {
  await requireAdmin(request, env);
  await env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
}
