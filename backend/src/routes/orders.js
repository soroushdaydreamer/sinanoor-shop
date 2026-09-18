import { json, error, HttpError, requireAuth, requireAdmin } from "../http.js";

const VALID_STATUS = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

// کاربر سفارش جدید ثبت می‌کند
export async function createOrder(request, env) {
  const user = await requireAuth(request, env);
  const b = await request.json().catch(() => ({}));
  const items = Array.isArray(b.items) ? b.items : [];
  if (items.length === 0) return error("سبد خرید خالی است");
  if (!b.address) return error("آدرس ارسال الزامی است");

  // قیمت‌ها را از دیتابیس می‌خوانیم تا کاربر نتواند قیمت را دستکاری کند
  let total = 0;
  const resolvedItems = [];
  for (const it of items) {
    const product = await env.DB.prepare("SELECT id, title, price, stock FROM products WHERE id = ? AND is_active = 1")
      .bind(it.product_id).first();
    if (!product) return error(`محصول با شناسه ${it.product_id} یافت نشد`, 404);
    const qty = Math.max(1, parseInt(it.qty || 1, 10));
    if (product.stock < qty) return error(`موجودی «${product.title}» کافی نیست`, 409);
    total += product.price * qty;
    resolvedItems.push({ product_id: product.id, title: product.title, price: product.price, qty });
  }

  const orderResult = await env.DB.prepare(
    "INSERT INTO orders (user_id, status, total_amount, address, phone) VALUES (?, 'pending', ?, ?, ?)"
  ).bind(user.uid, total, b.address, b.phone || null).run();

  const orderId = orderResult.meta.last_row_id;

  for (const it of resolvedItems) {
    await env.DB.prepare(
      "INSERT INTO order_items (order_id, product_id, title, price, qty) VALUES (?, ?, ?, ?, ?)"
    ).bind(orderId, it.product_id, it.title, it.price, it.qty).run();
    await env.DB.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").bind(it.qty, it.product_id).run();
  }

  return json({ ok: true, order_id: orderId, total_amount: total });
}

// سفارش‌های خود کاربر
export async function myOrders(request, env) {
  const user = await requireAuth(request, env);
  const { results: orders } = await env.DB.prepare(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC"
  ).bind(user.uid).all();

  for (const o of orders) {
    const { results: items } = await env.DB.prepare(
      "SELECT product_id, title, price, qty FROM order_items WHERE order_id = ?"
    ).bind(o.id).all();
    o.items = items;
  }
  return json({ ok: true, orders });
}

// ادمین: همه سفارش‌ها
export async function listOrdersAdmin(request, env) {
  await requireAdmin(request, env);
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  let sql = `SELECT o.*, u.name as user_name, u.phone as user_phone FROM orders o
             JOIN users u ON u.id = o.user_id`;
  const params = [];
  if (status) { sql += " WHERE o.status = ?"; params.push(status); }
  sql += " ORDER BY o.id DESC";

  const { results: orders } = await env.DB.prepare(sql).bind(...params).all();
  for (const o of orders) {
    const { results: items } = await env.DB.prepare(
      "SELECT product_id, title, price, qty FROM order_items WHERE order_id = ?"
    ).bind(o.id).all();
    o.items = items;
  }
  return json({ ok: true, orders });
}

// ادمین: تغییر وضعیت سفارش
export async function updateOrderStatus(request, env, params) {
  await requireAdmin(request, env);
  const b = await request.json().catch(() => ({}));
  if (!VALID_STATUS.includes(b.status)) return error("وضعیت نامعتبر است");

  const existing = await env.DB.prepare("SELECT id FROM orders WHERE id = ?").bind(params.id).first();
  if (!existing) throw new HttpError("سفارش یافت نشد", 404);

  await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(b.status, params.id).run();
  return json({ ok: true });
}
