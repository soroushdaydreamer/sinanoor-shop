import { corsHeaders, json, error, HttpError } from "./http.js";
import { createDatabase } from "./db.js";

import { register, login, me } from "./routes/auth.js";
import {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
} from "./routes/products.js";
import {
  listCategories, createCategory, updateCategory, deleteCategory,
} from "./routes/categories.js";
import {
  createOrder, myOrders, listOrdersAdmin, updateOrderStatus,
} from "./routes/orders.js";
import {
  listUsersAdmin, updateUserRoleAdmin, deleteUserAdmin,
} from "./routes/users.js";
import { getSettings, updateSettings } from "./routes/settings.js";
import { uploadImage } from "./routes/uploads.js";

// [متد, regex مسیر, هندلر]  — گروه‌های regex به عنوان params.id پاس داده می‌شوند
const routes = [
  ["POST", /^\/api\/auth\/register$/, register],
  ["POST", /^\/api\/auth\/login$/, login],
  ["GET", /^\/api\/auth\/me$/, me],

  ["GET", /^\/api\/products$/, listProducts],
  ["GET", /^\/api\/products\/(\d+)$/, getProduct],
  ["POST", /^\/api\/products$/, createProduct],
  ["PUT", /^\/api\/products\/(\d+)$/, updateProduct],
  ["DELETE", /^\/api\/products\/(\d+)$/, deleteProduct],

  ["GET", /^\/api\/categories$/, listCategories],
  ["POST", /^\/api\/categories$/, createCategory],
  ["PUT", /^\/api\/categories\/(\d+)$/, updateCategory],
  ["DELETE", /^\/api\/categories\/(\d+)$/, deleteCategory],

  ["POST", /^\/api\/orders$/, createOrder],
  ["GET", /^\/api\/orders\/mine$/, myOrders],
  ["GET", /^\/api\/admin\/orders$/, listOrdersAdmin],
  ["PATCH", /^\/api\/admin\/orders\/(\d+)$/, updateOrderStatus],

  ["GET", /^\/api\/admin\/users$/, listUsersAdmin],
  ["PATCH", /^\/api\/admin\/users\/(\d+)$/, updateUserRoleAdmin],
  ["DELETE", /^\/api\/admin\/users\/(\d+)$/, deleteUserAdmin],

  ["GET", /^\/api\/settings$/, getSettings],
  ["PUT", /^\/api\/admin\/settings$/, updateSettings],
  ["POST", /^\/api\/admin\/uploads$/, uploadImage],
];

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request, env);
    const runtimeEnv = { ...env, DB: createDatabase(env.DATABASE_URL) };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/api") {
      return json({ ok: true, name: "sina-noor-api", status: "running" }, {}, headers);
    }

    for (const [method, pattern, handler] of routes) {
      if (request.method !== method) continue;
      const match = url.pathname.match(pattern);
      if (!match) continue;

      try {
        const params = { id: match[1] };
        const res = await handler(request, runtimeEnv, params);
        // به همه‌ی پاسخ‌های موفق هدر CORS اضافه می‌شود
        const merged = new Response(res.body, res);
        Object.entries(headers).forEach(([k, v]) => merged.headers.set(k, v));
        return merged;
      } catch (err) {
        if (err instanceof HttpError) {
          return error(err.message, err.status, headers);
        }
        console.error(err);
        return error("خطای داخلی سرور", 500, headers);
      }
    }

    return error("مسیر یافت نشد", 404, headers);
  },
};
