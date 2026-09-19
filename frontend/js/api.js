// API روی همان دامنه سایت اجرا می‌شود تا تنظیمات جداگانه دامنه و CORS لازم نباشد.
const API_BASE = (window.SINA_NOOR_API_BASE || "").replace(/\/$/, "");

function normalizePhone(phone) {
  return String(phone || "")
    .replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[\s-()]/g, "");
}

function getToken() { return localStorage.getItem("sn_token"); }
function setToken(t) { localStorage.setItem("sn_token", t); }
function clearToken() { localStorage.removeItem("sn_token"); localStorage.removeItem("sn_user"); }
function getUser() {
  try { return JSON.parse(localStorage.getItem("sn_user") || "null"); } catch { return null; }
}
function setUser(u) { localStorage.setItem("sn_user", JSON.stringify(u)); }

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data;
  try { data = await res.json(); } catch {
    data = { ok: false, error: res.status === 404 ? "سرویس ثبت‌نام در دسترس نیست؛ اتصال API را بررسی کنید" : "پاسخ نامعتبر از سرور" };
  }
  if (!res.ok || data.ok === false) throw new Error(data.error || `خطای سرور (${res.status})`);
  return data;
}

const api = {
  register: (name, phone, password) =>
    apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify({ name, phone: normalizePhone(phone), password }) }),
  login: (phone, password) =>
    apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ phone: normalizePhone(phone), password }) }),
  me: () => apiFetch("/api/auth/me"),

  listProducts: (qs = "") => apiFetch(`/api/products${qs}`),
  getProduct: (id) => apiFetch(`/api/products/${id}`),

  listCategories: () => apiFetch("/api/categories"),

  createOrder: (payload) => apiFetch("/api/orders", { method: "POST", body: JSON.stringify(payload) }),
  myOrders: () => apiFetch("/api/orders/mine"),

  getToken, setToken, clearToken, getUser, setUser,
  isLoggedIn: () => !!getToken(),
};

window.api = api;
