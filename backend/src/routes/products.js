import { json, error, HttpError, requireAdmin } from "../http.js";

export async function listProducts(request, env) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const deal = url.searchParams.get("deal"); // "1" => فقط پیشنهاد شگفت‌انگیز
  const q = url.searchParams.get("q");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  let sql = "SELECT * FROM products WHERE is_active = TRUE";
  const params = [];
  if (category) { sql += " AND category_id = ?"; params.push(category); }
  if (deal === "1") { sql += " AND is_deal = TRUE"; }
  if (q) { sql += " AND title LIKE ?"; params.push(`%${q}%`); }
  sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return json({ ok: true, products: results });
}

export async function getProduct(request, env, params) {
  const product = await env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(params.id).first();
  if (!product) throw new HttpError("محصول یافت نشد", 404);
  return json({ ok: true, product });
}

export async function createProduct(request, env) {
  await requireAdmin(request, env);
  const b = await request.json().catch(() => ({}));
  if (!b.title || !b.price) return error("عنوان و قیمت الزامی است");

  const result = await env.DB.prepare(
    `INSERT INTO products (title, category_id, price, old_price, stock, image_url, is_deal, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    b.title, b.category_id || null, b.price, b.old_price || null,
    b.stock ?? 0, b.image_url || null, Boolean(b.is_deal), b.is_active !== false
  ).run();

  return json({ ok: true, id: result.meta.last_row_id });
}

export async function updateProduct(request, env, params) {
  await requireAdmin(request, env);
  const b = await request.json().catch(() => ({}));
  const existing = await env.DB.prepare("SELECT id FROM products WHERE id = ?").bind(params.id).first();
  if (!existing) throw new HttpError("محصول یافت نشد", 404);

  await env.DB.prepare(
    `UPDATE products SET title=?, category_id=?, price=?, old_price=?, stock=?, image_url=?, is_deal=?, is_active=?
     WHERE id=?`
  ).bind(
    b.title, b.category_id || null, b.price, b.old_price || null,
    b.stock ?? 0, b.image_url || null, Boolean(b.is_deal), b.is_active !== false,
    params.id
  ).run();

  return json({ ok: true });
}

export async function deleteProduct(request, env, params) {
  await requireAdmin(request, env);
  await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
}
