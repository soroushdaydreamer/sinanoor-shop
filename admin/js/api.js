// کلاینت API پنل مدیریت — به همان بک‌اند Cloudflare Workers وصل می‌شود
const API_BASE = window.SINA_NOOR_API_BASE || "https://api.sinanoor.com";

function getToken() { return localStorage.getItem("sn_admin_token"); }
function setToken(t) { localStorage.setItem("sn_admin_token", t); }
function clearToken() { localStorage.removeItem("sn_admin_token"); localStorage.removeItem("sn_admin_user"); }
function getUser() { try { return JSON.parse(localStorage.getItem("sn_admin_user") || "null"); } catch { return null; } }
function setUser(u) { localStorage.setItem("sn_admin_user", JSON.stringify(u)); }

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data;
  try { data = await res.json(); } catch { data = { ok: false, error: "پاسخ نامعتبر از سرور" }; }
  if (!res.ok || data.ok === false) throw new Error(data.error || "خطایی رخ داد");
  return data;
}

const api = {
  login: (phone, password) => apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ phone, password }) }),
  me: () => apiFetch("/api/auth/me"),

  listProducts: (qs = "?limit=100") => apiFetch(`/api/products${qs}`),
  createProduct: (p) => apiFetch("/api/products", { method: "POST", body: JSON.stringify(p) }),
  updateProduct: (id, p) => apiFetch(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(p) }),
  deleteProduct: (id) => apiFetch(`/api/products/${id}`, { method: "DELETE" }),

  listCategories: () => apiFetch("/api/categories"),
  createCategory: (c) => apiFetch("/api/categories", { method: "POST", body: JSON.stringify(c) }),
  updateCategory: (id, c) => apiFetch(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(c) }),
  deleteCategory: (id) => apiFetch(`/api/categories/${id}`, { method: "DELETE" }),

  listOrders: (status = "") => apiFetch(`/api/admin/orders${status ? `?status=${status}` : ""}`),
  updateOrderStatus: (id, status) => apiFetch(`/api/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),

  listUsers: () => apiFetch("/api/admin/users"),
  updateUserRole: (id, role) => apiFetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) }),
  deleteUser: (id) => apiFetch(`/api/admin/users/${id}`, { method: "DELETE" }),

  getToken, setToken, clearToken, getUser, setUser,
  isLoggedIn: () => !!getToken(),
};
window.api = api;

// محافظ صفحات: باید وارد شده و نقش ادمین داشته باشد
async function guardAdmin() {
  if (!api.isLoggedIn()) { window.location.href = "login.html"; return null; }
  try {
    const { user } = await api.me();
    if (user.role !== "admin") {
      alert("دسترسی شما به پنل مدیریت مجاز نیست.");
      api.clearToken();
      window.location.href = "login.html";
      return null;
    }
    api.setUser(user);
    return user;
  } catch {
    api.clearToken();
    window.location.href = "login.html";
    return null;
  }
}
window.guardAdmin = guardAdmin;
