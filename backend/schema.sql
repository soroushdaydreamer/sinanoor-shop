-- سینا نور — اسکیمای دیتابیس (Cloudflare D1 / SQLite)
-- اجرا: wrangler d1 execute sina-noor-db --file=./schema.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  icon       TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  category_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  price        INTEGER NOT NULL,          -- تومان
  old_price    INTEGER,                   -- قیمت قبل از تخفیف (اختیاری)
  stock        INTEGER NOT NULL DEFAULT 0,
  image_url    TEXT,                      -- در صورت خالی بودن، پلیس‌هولدر گرادیانی نمایش داده می‌شود
  is_deal      INTEGER NOT NULL DEFAULT 0, -- 1 = در بخش «پیشنهاد شگفت‌انگیز»
  is_active    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  status       TEXT NOT NULL DEFAULT 'pending', -- pending|confirmed|shipped|delivered|cancelled
  total_amount INTEGER NOT NULL,
  address      TEXT,
  phone        TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  title      TEXT NOT NULL,   -- کپی عنوان در لحظه خرید
  price      INTEGER NOT NULL, -- کپی قیمت در لحظه خرید
  qty        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- داده‌ی اولیه نمونه
INSERT OR IGNORE INTO categories (id, name, slug, icon, sort_order) VALUES
 (1,'برق و روشنایی','lighting','💡',1),
 (2,'لوازم صوتی تصویری','audio-video','🔊',2),
 (3,'کلید و پریز','switches','🔌',3);

INSERT OR IGNORE INTO products (id, title, category_id, price, old_price, stock, is_deal) VALUES
 (1,'چندراهی ۶ خانه با محافظ برق',3,385000,460000,25,1),
 (2,'آیفون تصویری دو واحدی رنگی',2,2450000,2890000,10,1),
 (3,'پنل LED مربعی ۲۴ وات پارس شعاع توس',1,195000,NULL,40,0),
 (4,'لامپ COB هالوژنی ۱۲ وات',1,118000,149000,60,1),
 (5,'کلید و پریز سری آوا',3,62000,NULL,100,0);
