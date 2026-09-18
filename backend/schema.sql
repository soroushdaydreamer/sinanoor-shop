-- Sina Noor PostgreSQL schema for Neon
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  price BIGINT NOT NULL,
  old_price BIGINT,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_deal BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount BIGINT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  title TEXT NOT NULL,
  price BIGINT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0)
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
 (1,'برق و روشنایی','lighting','💡',1), (2,'لوازم صوتی تصویری','audio-video','🔊',2), (3,'کلید و پریز','switches','🔌',3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, title, category_id, price, old_price, stock, is_deal) VALUES
 (1,'چندراهی ۶ خانه با محافظ برق',3,385000,460000,25,TRUE), (2,'آیفون تصویری دو واحدی رنگی',2,2450000,2890000,10,TRUE), (3,'پنل LED مربعی ۲۴ وات پارس شعاع توس',1,195000,NULL,40,FALSE), (4,'لامپ COB هالوژنی ۱۲ وات',1,118000,149000,60,TRUE), (5,'کلید و پریز سری آوا',3,62000,NULL,100,FALSE)
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1), true);
SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1), true);
SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1), true);
