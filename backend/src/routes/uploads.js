import { put } from "@vercel/blob";
import { json, error, requireAdmin } from "../http.js";

export async function uploadImage(request, env) {
  await requireAdmin(request, env);
  if (!env.BLOB_READ_WRITE_TOKEN) return error("ذخیره‌ساز تصویر تنظیم نشده است", 503);
  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file.arrayBuffer !== "function") return error("فایل تصویر انتخاب نشده است");
  if (!String(file.type || "").startsWith("image/")) return error("فقط فایل تصویری مجاز است");
  if (file.size > 5 * 1024 * 1024) return error("حجم تصویر نباید بیشتر از ۵ مگابایت باشد");
  const safeName = String(file.name || "image").replace(/[^a-zA-Z0-9._-]/g, "-");
  const blob = await put(`products/${Date.now()}-${safeName}`, file, { access: "public", token: env.BLOB_READ_WRITE_TOKEN });
  return json({ ok: true, url: blob.url });
}
