import { json, error, requireAdmin } from "../http.js";

export async function getSettings(request, env) {
  const settings = await env.DB.prepare("SELECT * FROM site_settings WHERE id = 1").first();
  return json({ ok: true, settings: settings || {} });
}

export async function updateSettings(request, env) {
  await requireAdmin(request, env);
  const body = await request.json().catch(() => ({}));
  const values = [body.store_name, body.contact_phone, body.contact_whatsapp, body.contact_address, body.contact_email, body.instagram_url];
  if (!body.store_name) return error("نام فروشگاه الزامی است");
  await env.DB.prepare(`UPDATE site_settings SET store_name=?, contact_phone=?, contact_whatsapp=?, contact_address=?, contact_email=?, instagram_url=?, updated_at=NOW() WHERE id=1`).bind(...values).run();
  return json({ ok: true });
}
